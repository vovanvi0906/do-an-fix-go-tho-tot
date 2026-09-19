import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DisputeOrderDto {
  @ApiProperty({
    type: String,
    description: 'Lý do khiếu nại chất lượng dịch vụ của khách hàng',
    example: 'Kỹ thuật viên chưa sửa xong aptomat vẫn bị chập, bỏ về sớm',
  })
  @IsString({ message: 'Lý do khiếu nại phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Lý do khiếu nại không được để trống' })
  reason;

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách URL hình ảnh bằng chứng khiếu nại',
    example: ['https://storage.fixgo.vn/disputes/evidence-1.jpg'],
  })
  @IsOptional()
  @IsArray({ message: 'evidenceImages phải là một mảng chuỗi URL' })
  evidenceImages;
}
