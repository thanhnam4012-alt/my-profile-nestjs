import { Type } from 'class-transformer';
import { IsIn, IsInt, Max, Min } from 'class-validator';

export class EarnPointsDto {
  @Type(() => Number)
  @IsInt({ message: 'Số điểm phải là số nguyên' })
  @Min(1, { message: 'Số điểm tối thiểu là 1' })
  @Max(100, { message: 'Mỗi lần chỉ được cộng tối đa 100 điểm' })
  amount!: number;

  @IsIn(['mini-game', 'lesson', 'quest'], {
    message: 'Nguồn điểm phải là mini-game, lesson hoặc quest',
  })
  source!: string;
}
