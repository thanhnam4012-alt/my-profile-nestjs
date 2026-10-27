import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateSubjectDto } from './create-subject.dto';
import { Type } from 'class-transformer';

export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  timeStart!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  timeEnd!: number;

  @IsOptional()
  room!: string;

  @IsOptional()
  @IsString()
  des?: string;

  @IsOptional()
  @IsString({ each: true })
  replaceIds!: string[];
}
