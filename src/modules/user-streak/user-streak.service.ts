import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { UserService } from '../user/user.service';
import { UserStreak, UserStreakDocument } from './entities/user-streak.entity';
import {
  StreakCheckin,
  StreakCheckinDocument,
} from './entities/streak-checkin.entity';
import { MakeupCheckinDto } from './dto/makeup-checkin.dto';
import { EarnPointsDto } from './dto/earn-points.dto';
import { QueryCalendarDto } from './dto/query-calendar.dto';
import {
  DAILY_CHECKIN_POINTS,
  MAKEUP_COST,
  STREAK_MILESTONES,
} from './containts/user-streak.constants';
import {
  addDays,
  computeStreakStats,
  findChainRange,
  getDaysInMonth,
  getVnDateString,
} from './utils/user-streak.utils';

@Injectable()
export class UserStreakService {
  constructor(
    @InjectModel(UserStreak.name)
    private readonly userStreakModel: Model<UserStreakDocument>,
    @InjectModel(StreakCheckin.name)
    private readonly checkinModel: Model<StreakCheckinDocument>,
    private readonly userService: UserService,
  ) {}

  // ───────────── API 1: Xem tổng quan streak ─────────────
  async getSummary(userId: string) {
    const streak = await this.getOrCreateStreak(userId);
    const today = getVnDateString();

    return {
      success: true,
      data: {
        ...this.buildStreakView(streak, today),
        dailyCheckinPoints: DAILY_CHECKIN_POINTS,
        makeupCost: MAKEUP_COST,
        milestones: STREAK_MILESTONES,
      },
    };
  }

  // ───────────── API 2: Lịch điểm danh theo tháng ─────────────
  async getCalendar(userId: string, query: QueryCalendarDto) {
    const streak = await this.getOrCreateStreak(userId);
    const today = getVnDateString();
    const currentMonth = today.slice(0, 7); // 'YYYY-MM'
    const month = query.month ?? currentMonth;
    const totalDays = getDaysInMonth(month);

    const firstDay = `${month}-01`;
    const lastDay = `${month}-${String(totalDays).padStart(2, '0')}`;

    // Lấy các ngày đã điểm danh trong tháng (dùng index userId + date)
    const records = await this.checkinModel
      .find({ userId: streak.userId, date: { $gte: firstDay, $lte: lastDay } })
      .lean()
      .exec();
    const recordMap = new Map(records.map((r) => [r.date, r]));

    const days = Array.from({ length: totalDays }, (_, index) => {
      const date = `${month}-${String(index + 1).padStart(2, '0')}`;
      const record = recordMap.get(date);

      let status: 'checkin' | 'makeup' | 'today' | 'missed' | 'future';
      if (record) status = record.type;
      else if (date === today) status = 'today';
      else if (date > today) status = 'future';
      else status = 'missed';

      return {
        date,
        status,
        // Chỉ được bù ngày bị lỡ thuộc tháng hiện tại
        canMakeup: status === 'missed' && month === currentMonth,
        milestones: record?.milestones ?? [],
      };
    });

    return {
      success: true,
      data: { month, days },
    };
  }

  // ───────────── API 3: Điểm danh hôm nay ─────────────
  async checkin(userId: string) {
    const streak = await this.getOrCreateStreak(userId);
    const today = getVnDateString();

    let checkinDoc: StreakCheckinDocument;
    try {
      checkinDoc = await this.checkinModel.create({
        userId: streak.userId,
        date: today,
        type: 'checkin',
        pointsEarned: DAILY_CHECKIN_POINTS,
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Hôm nay bạn đã điểm danh rồi.');
      }
      throw error;
    }

    const result = await this.applyStreakUpdate(streak, checkinDoc, 'checkin');

    return {
      success: true,
      message: 'Điểm danh thành công',
      data: result,
    };
  }

  // ───────────── API 4: Bù ngày bị quên ─────────────
  async makeup(userId: string, dto: MakeupCheckinDto) {
    const streak = await this.getOrCreateStreak(userId);
    const today = getVnDateString();
    const firstDayOfMonth = `${today.slice(0, 7)}-01`;

    // 1. Kiểm tra ngày hợp lệ
    if (dto.date >= today) {
      throw new BadRequestException('Chỉ được bù những ngày trước hôm nay.');
    }
    if (dto.date < firstDayOfMonth) {
      throw new BadRequestException('Chỉ được bù những ngày trong tháng này.');
    }

    const existed = await this.checkinModel
      .exists({ userId: streak.userId, date: dto.date })
      .exec();
    if (existed) {
      throw new ConflictException('Ngày này đã được điểm danh rồi.');
    }

    // 2. Trừ điểm nguyên tử: chỉ trừ khi đủ điểm
    const paid = await this.userStreakModel
      .findOneAndUpdate(
        { _id: streak._id, rewardPoints: { $gte: MAKEUP_COST } },
        { $inc: { rewardPoints: -MAKEUP_COST } },
        { new: true },
      )
      .exec();
    if (!paid) {
      throw new BadRequestException(
        `Bạn cần ít nhất ${MAKEUP_COST} điểm để bù 1 ngày.`,
      );
    }

    // 3. Ghi ngày bù. Nếu bị trùng (2 request cùng lúc) thì hoàn điểm
    let checkinDoc: StreakCheckinDocument;
    try {
      checkinDoc = await this.checkinModel.create({
        userId: streak.userId,
        date: dto.date,
        type: 'makeup',
        pointsSpent: MAKEUP_COST,
      });
    } catch (error) {
      await this.userStreakModel
        .updateOne({ _id: streak._id }, { $inc: { rewardPoints: MAKEUP_COST } })
        .exec();
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Ngày này đã được điểm danh rồi.');
      }
      throw error;
    }

    // 4. Tính lại chuỗi
    const result = await this.applyStreakUpdate(paid, checkinDoc, 'makeup');

    return {
      success: true,
      message: `Bù ngày ${dto.date} thành công`,
      data: result,
    };
  }

  // ───────────── API 5: Cộng điểm từ game / bài học ─────────────
  async earnPoints(userId: string, dto: EarnPointsDto) {
    const streak = await this.getOrCreateStreak(userId);

    const updated = await this.userStreakModel
      .findByIdAndUpdate(
        streak._id,
        { $inc: { rewardPoints: dto.amount } },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new InternalServerErrorException('Không thể cộng điểm.');
    }

    return {
      success: true,
      message: `Bạn nhận được ${dto.amount} điểm từ ${dto.source}`,
      data: { rewardPoints: updated.rewardPoints },
    };
  }

  // ═════════════ Các hàm hỗ trợ (private) ═════════════

  /** Lấy bản ghi streak của user, chưa có thì tạo mới */
  private async getOrCreateStreak(userId: string) {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException('userId không hợp lệ.');
    }
    // Ném NotFoundException nếu user không tồn tại
    await this.userService.findOne(userId);

    const objectId = new Types.ObjectId(userId);
    const streak = await this.userStreakModel
      .findOneAndUpdate(
        { userId: objectId },
        { $setOnInsert: { userId: objectId } }, // Chỉ set khi tạo mới
        { new: true, upsert: true },
      )
      .exec();
    if (!streak) {
      throw new InternalServerErrorException('Không thể khởi tạo streak.');
    }
    return streak;
  }

  /** Sau khi thêm 1 ngày (checkin/makeup): tính lại chuỗi, thưởng mốc, lưu lại */
  private async applyStreakUpdate(
    streak: UserStreakDocument,
    checkinDoc: StreakCheckinDocument,
    type: 'checkin' | 'makeup',
  ) {
    const today = getVnDateString();

    // Lấy toàn bộ ngày đã điểm danh của user (tối đa ~365 bản ghi/năm)
    const allCheckins = await this.checkinModel
      .find({ userId: streak.userId })
      .select('date milestones')
      .sort({ date: 1 })
      .lean()
      .exec();
    const dates = allCheckins.map((c) => c.date);

    const { currentStreak, longestStreak } = computeStreakStats(dates, today);

    // Thưởng mốc: chỉ xét khi ngày vừa thêm thuộc chuỗi hiện tại
    const { start, end } = findChainRange(dates, checkinDoc.date);
    const isCurrentChain = end >= addDays(today, -1);

    const newMilestones: number[] = [];
    let bonus = 0;
    if (isCurrentChain) {
      // Mốc nào đã thưởng trong chuỗi này rồi thì bỏ qua (chống nhận 2 lần)
      const claimed = new Set(
        allCheckins
          .filter((c) => c.date >= start && c.date <= end)
          .flatMap((c) => c.milestones ?? []),
      );
      for (const milestone of STREAK_MILESTONES) {
        if (currentStreak >= milestone.days && !claimed.has(milestone.days)) {
          newMilestones.push(milestone.days);
          bonus += milestone.bonus;
        }
      }
    }

    if (bonus > 0) {
      await this.checkinModel
        .updateOne(
          { _id: checkinDoc._id },
          {
            $push: { milestones: { $each: newMilestones } },
            $inc: { pointsEarned: bonus },
          },
        )
        .exec();
    }

    const basePoints = type === 'checkin' ? DAILY_CHECKIN_POINTS : 0;
    const counterField = type === 'checkin' ? 'totalCheckins' : 'totalMakeups';

    const updated = await this.userStreakModel
      .findByIdAndUpdate(
        streak._id,
        {
          $set: {
            currentStreak,
            longestStreak,
            lastCheckinDate: dates[dates.length - 1],
          },
          $inc: { rewardPoints: basePoints + bonus, [counterField]: 1 },
        },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new InternalServerErrorException('Không thể cập nhật streak.');
    }

    return {
      streak: this.buildStreakView(updated, today),
      earnedPoints: basePoints + bonus,
      newMilestones,
    };
  }

  /** Dữ liệu streak trả về cho FE */
  private buildStreakView(streak: UserStreakDocument, today: string) {
    const yesterday = addDays(today, -1);
    // currentStreak trong DB có thể "cũ" nếu user đã bỏ lỡ nhiều ngày
    const isAlive =
      streak.lastCheckinDate !== null && streak.lastCheckinDate >= yesterday;

    return {
      currentStreak: isAlive ? streak.currentStreak : 0,
      longestStreak: streak.longestStreak,
      rewardPoints: streak.rewardPoints,
      lastCheckinDate: streak.lastCheckinDate,
      checkedInToday: streak.lastCheckinDate === today,
      totalCheckins: streak.totalCheckins,
      totalMakeups: streak.totalMakeups,
    };
  }

  /** Lỗi trùng unique index của MongoDB có code 11000 */
  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}
