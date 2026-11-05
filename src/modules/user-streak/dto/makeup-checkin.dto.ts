import { IsNotEmpty, Matches } from 'class-validator';

export class MakeupCheckinDto {
  @IsNotEmpty({ message: 'Ngày cần bù không được để trống' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Ngày phải có định dạng YYYY-MM-DD',
  })
  date!: string;
}
