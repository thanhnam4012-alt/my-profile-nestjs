import { IsOptional, Matches } from 'class-validator';

export class QueryWeekDto {
  // Ngày bất kỳ trong tuần cần xem, dạng 'YYYY-MM-DD'. Bỏ trống = tuần hiện tại (hôm nay)
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Ngày phải có định dạng YYYY-MM-DD',
  })
  date?: string;
}
