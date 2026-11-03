import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Tên người dùng phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên người dùng không được để trống' })
  name!: string;

  @IsEmail({}, { message: 'Email không đúng định dạng hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email!: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password!: string;

  @IsOptional()
  @IsString({ message: 'Đường dẫn ảnh đại diện phải là chuỗi' })
  avatar?: string;

  @IsOptional()
  @IsIn(['learner', 'admin'], {
    message: 'Vai trò phải là learner hoặc admin',
  })
  role?: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'banned'], {
    message: 'Trạng thái phải là active, inactive hoặc banned',
  })
  status?: string;
}
