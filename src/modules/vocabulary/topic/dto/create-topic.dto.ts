import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTopicDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên tiếng Anh của chủ đề không được để trống' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên tiếng Việt của chủ đề không được để trống' })
  titleVi!: string;

  @IsString()
  @IsNotEmpty({ message: 'Đường dẫn (slug) không được để trống' })
  slug!: string;

  @IsOptional()
  @IsIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], {
    message: 'Cấp độ phải thuộc một trong các giá trị: A1, A2, B1, B2, C1, C2',
  })
  level?: string;

  @IsOptional()
  @IsString()
  themeColor?: string;

  @IsOptional()
  @IsString()
  iconName?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['published', 'draft'], {
    message: 'Trạng thái phải là published hoặc draft',
  })
  status?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'order phải là số' })
  order?: number;
}
