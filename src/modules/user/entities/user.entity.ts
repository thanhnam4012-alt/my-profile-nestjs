import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      const idVal = ret._id as { toString?: () => string } | undefined;
      ret.id = typeof idVal?.toString === 'function' ? idVal.toString() : '';
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ type: String, default: '', trim: true })
  avatar!: string;

  @Prop({
    type: String,
    enum: ['learner', 'admin'],
    default: 'learner',
    index: true,
  })
  role!: string;

  @Prop({
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active',
    index: true,
  })
  status!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
