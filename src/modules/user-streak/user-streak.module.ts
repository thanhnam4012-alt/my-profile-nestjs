import { Module } from '@nestjs/common';
import { UserStreakController } from './user-streak.controller';
import { UserStreakService } from './user-streak.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserStreak, UserStreakSchema } from './entities/user-streak.entity';
import {
  StreakCheckin,
  StreakCheckinSchema,
} from './entities/streak-checkin.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserStreak.name, schema: UserStreakSchema },
      { name: StreakCheckin.name, schema: StreakCheckinSchema },
    ]),
    UserModule,
  ],
  controllers: [UserStreakController],
  providers: [UserStreakService],
})
export class UserStreakModule {}
