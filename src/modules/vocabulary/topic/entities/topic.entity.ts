import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TopicDocument = HydratedDocument<Topic>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      const idVal = ret._id as { toString?: () => string } | undefined;
      ret.id = typeof idVal?.toString === 'function' ? idVal.toString() : '';
      delete ret.__v;
      return ret;
    },
  },
})
export class Topic {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  titleVi!: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  slug!: string;

  @Prop({
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    default: 'A1',
    index: true,
  })
  level!: string;

  @Prop({ type: String, default: 'emerald', trim: true })
  themeColor!: string;

  @Prop({ type: String, default: 'BookOpen', trim: true })
  iconName!: string;

  @Prop({ type: String, default: '', trim: true })
  imageUrl!: string;

  @Prop({ type: String, default: '', trim: true })
  description!: string;

  @Prop({
    type: String,
    enum: ['published', 'draft'],
    default: 'published',
    index: true,
  })
  status!: string;

  @Prop({ type: Boolean, default: false, index: true })
  featured!: boolean;

  @Prop({ type: Number, default: 0 })
  order!: number;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
