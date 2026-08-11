import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @Type(() => Number)
  @IsNumber()
  timeStart!: number;

  @Type(() => Number)
  @IsNumber()
  timeEnd!: number;

  @IsOptional()
  @IsString()
  room?: string;

  @IsOptional()
  @IsString()
  des?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  replaceIds?: string[];
}
