import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StreakCheckinDocument = HydratedDocument<StreakCheckin>;

@Schema({
  collection: 'streak_checkins',
  timestamps: true,
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
export class StreakCheckin {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ })
  date!: string;

  @Prop({ type: String, enum: ['checkin', 'makeup'], required: true })
  type!: 'checkin' | 'makeup';

  @Prop({ type: Number, default: 0, min: 0 })
  pointsEarned!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  pointsSpent!: number;
  // Các mốc (7, 14, 30) đã được thưởng tại ngày này
  @Prop({ type: [Number], default: [] })
  milestones!: number[];
}

export const StreakCheckinSchema = SchemaFactory.createForClass(StreakCheckin);
StreakCheckinSchema.index({ userId: 1, date: 1 }, { unique: true });
