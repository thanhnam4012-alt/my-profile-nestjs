import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import * as crypto from 'crypto';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private hashPassword(password: string): string {
    const salt = 'learn_eng_user_salt';
    return crypto.scryptSync(password, salt, 32).toString('hex');
  }

  async login(loginUserDto: LoginUserDto) {
    const email = loginUserDto.email.trim().toLowerCase();

    // Query user including password (as password has select: false)
    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .exec();

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    if (user.status === 'banned') {
      throw new UnauthorizedException(
        'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
      );
    }

    if (user.status === 'inactive') {
      throw new UnauthorizedException(
        'Tài khoản chưa được kích hoạt hoặc đang tạm ngưng.',
      );
    }

    const hashedPassword = this.hashPassword(loginUserDto.password);
    if (user.password !== hashedPassword) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    // Generate secure session token
    const rawToken = `${user._id.toString()}:${Date.now()}`;
    const token = crypto
      .createHash('sha256')
      .update(rawToken + 'learn_eng_auth_secret')
      .digest('hex');

    const userObj = user.toJSON();

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: userObj,
        token,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    const email = createUserDto.email.trim().toLowerCase();

    // Check duplicate email
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      throw new ConflictException(
        `Email "${email}" đã được đăng ký trong hệ thống. Vui lòng đăng nhập hoặc sử dụng email khác.`,
      );
    }

    const hashedPassword = this.hashPassword(createUserDto.password);

    const createdUser = await this.userModel.create({
      name: createUserDto.name.trim(),
      email,
      password: hashedPassword,
      avatar: createUserDto.avatar || '',
      role: createUserDto.role || 'learner',
      status: createUserDto.status || 'active',
    });

    // Generate secure session token
    const rawToken = `${createdUser._id.toString()}:${Date.now()}`;
    const token = crypto
      .createHash('sha256')
      .update(rawToken + 'learn_eng_auth_secret')
      .digest('hex');

    const userObj = createdUser.toJSON();

    return {
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: {
        user: userObj,
        token,
      },
    };
  }

  async create(createUserDto: CreateUserDto) {
    const email = createUserDto.email.trim().toLowerCase();

    // Check duplicate email
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      throw new ConflictException(
        `Người dùng với email "${email}" đã tồn tại trong hệ thống.`,
      );
    }

    const hashedPassword = this.hashPassword(createUserDto.password);

    const createdUser = await this.userModel.create({
      ...createUserDto,
      email,
      password: hashedPassword,
    });

    return {
      success: true,
      message: 'Tạo người dùng thành công',
      data: createdUser,
    };
  }

  async findAll(query: QueryUserDto) {
    const filter: Record<string, unknown> = {};

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    if (query.role && query.role !== 'all') {
      filter.role = query.role;
    }

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortDirection };

    if (query.all === true || query.limit === 0) {
      const items = await this.userModel.find(filter).sort(sortOptions).exec();

      return {
        success: true,
        data: items,
        pagination: {
          page: 1,
          limit: items.length,
          total: items.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query.limit && query.limit > 0 ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(idOrEmail: string) {
    let user: UserDocument | null = null;

    if (isValidObjectId(idOrEmail)) {
      user = await this.userModel.findById(idOrEmail).exec();
    }

    if (!user) {
      user = await this.userModel
        .findOne({ email: idOrEmail.trim().toLowerCase() })
        .exec();
    }

    if (!user) {
      throw new NotFoundException(
        `Không tìm thấy người dùng với định danh: ${idOrEmail}`,
      );
    }

    return {
      success: true,
      data: user,
    };
  }

  async update(idOrEmail: string, updateUserDto: UpdateUserDto) {
    const { data: existingUser } = await this.findOne(idOrEmail);

    const updatePayload: Record<string, unknown> = { ...updateUserDto };

    // Check duplicate email if updating email
    if (updateUserDto.email) {
      const normalizedEmail = updateUserDto.email.trim().toLowerCase();
      updatePayload.email = normalizedEmail;

      const duplicate = await this.userModel
        .findOne({
          email: normalizedEmail,
          _id: { $ne: existingUser._id },
        })
        .exec();

      if (duplicate) {
        throw new ConflictException(
          `Email "${normalizedEmail}" đã được sử dụng bởi người dùng khác.`,
        );
      }
    }

    // Hash password if updating password
    if (updateUserDto.password) {
      updatePayload.password = this.hashPassword(updateUserDto.password);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(existingUser._id, updatePayload, { new: true })
      .exec();

    return {
      success: true,
      message: 'Cập nhật thông tin người dùng thành công',
      data: updatedUser,
    };
  }

  async remove(idOrEmail: string) {
    const { data: existingUser } = await this.findOne(idOrEmail);

    await this.userModel.findByIdAndDelete(existingUser._id).exec();

    return {
      success: true,
      message: 'Xóa người dùng thành công',
      data: existingUser,
    };
  }
}
