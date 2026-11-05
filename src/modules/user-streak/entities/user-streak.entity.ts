import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserStreakDocument = HydratedDocument<UserStreak>;

@Schema({
  collection: 'user_streaks', // Tên collection trong MongoDB
  timestamps: true, // Tự thêm createdAt, updatedAt
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      const idVal = ret._id as { toString?: () => string } | undefined;
      ret.id = typeof idVal?.toString === 'function' ? idVal.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class UserStreak {
  // Liên kết tới bảng users, mỗi user chỉ có 1 bản ghi streak
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  currentStreak!: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  longestStreak!: number;

  @Prop({ type: String, default: null })
  lastCheckinDate!: string | null;

  @Prop({ type: Number, default: 0, min: 0 })
  rewardPoints!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalCheckins!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalMakeups!: number;
}

export const UserStreakSchema = SchemaFactory.createForClass(UserStreak);
