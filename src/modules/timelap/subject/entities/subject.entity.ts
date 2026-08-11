import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubjectDocument = HydratedDocument<Subject>;

@Schema({
  timestamps: true,
})
export class Subject {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  timeStart!: number;

  @Prop({ required: true })
  timeEnd!: number;

  @Prop({ required: true })
  dayOfWeek!: number;

  @Prop()
  room!: string;

  @Prop()
  des?: string;

  @Prop({
    type: [String],
    default: [],
  })
  replaceIds!: string[];
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
