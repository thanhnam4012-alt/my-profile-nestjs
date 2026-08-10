import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Type(() => Number)
  @IsNumber()
  timeStart!: number;

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
