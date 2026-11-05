import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserStreakService } from './user-streak.service';
import { MakeupCheckinDto } from './dto/makeup-checkin.dto';
import { EarnPointsDto } from './dto/earn-points.dto';
import { QueryCalendarDto } from './dto/query-calendar.dto';

@Controller('streaks')
export class UserStreakController {
  constructor(private readonly userStreakService: UserStreakService) {}

  // GET /streaks/:userId
  @Get(':userId')
  getSummary(@Param('userId') userId: string) {
    return this.userStreakService.getSummary(userId);
  }

  // GET /streaks/:userId/calendar?month=2026-11
  @Get(':userId/calendar')
  getCalendar(
    @Param('userId') userId: string,
    @Query() query: QueryCalendarDto,
  ) {
    return this.userStreakService.getCalendar(userId, query);
  }

  // POST /streaks/:userId/checkin
  @Post(':userId/checkin')
  checkin(@Param('userId') userId: string) {
    return this.userStreakService.checkin(userId);
  }

  // POST /streaks/:userId/makeup   body: { "date": "2026-11-03" }
  @Post(':userId/makeup')
  makeup(@Param('userId') userId: string, @Body() dto: MakeupCheckinDto) {
    return this.userStreakService.makeup(userId, dto);
  }

  // POST /streaks/:userId/points   body: { "amount": 20, "source": "mini-game" }
  @Post(':userId/points')
  earnPoints(@Param('userId') userId: string, @Body() dto: EarnPointsDto) {
    return this.userStreakService.earnPoints(userId, dto);
  }
}
