import { IsNotEmpty, IsInt, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewOrderDto {
  @ApiProperty({
    type: Number,
    description: 'Số điểm đánh giá chất lượng (từ 1 đến 5 sao)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: 'rating phải là số nguyên từ 1 đến 5' })
  @Min(1, { message: 'Điểm đánh giá tối thiểu là 1 sao' })
  @Max(5, { message: 'Điểm đánh giá tối đa là 5 sao' })
  @IsNotEmpty({ message: 'rating không được để trống' })
  rating;

  @ApiPropertyOptional({
    type: String,
    description: 'Nội dung nhận xét về thái độ và tay nghề của kỹ thuật viên',
    example: 'Thợ đến đúng giờ, tay nghề xuất sắc, tư vấn nhiệt tình và sạch sẽ.',
  })
  @IsOptional()
  @IsString()
  comment;
}
