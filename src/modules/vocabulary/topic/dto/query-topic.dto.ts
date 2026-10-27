import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryTopicDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'all'])
  level?: string;

  @IsOptional()
  @IsIn(['published', 'draft', 'all'])
  status?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') {
      return true;
    }
    if (value === 'false' || value === false || value === 0 || value === '0') {
      return false;
    }
    return undefined;
  })
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Transform(
    ({ value }: { value: unknown }) => value === 'true' || value === true,
  )
  @IsBoolean()
  all?: boolean;
}
