import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DiagnoseOrderDto {
  @ApiProperty({
    type: String,
    description: 'URL của hình ảnh sự cố kỹ thuật cần chẩn đoán',
    example: 'https://storage.fixgo.vn/issues/cb-chap-chay.jpg',
  })
  @IsString({ message: 'imageUrl phải là chuỗi ký tự hợp lệ' })
  @IsNotEmpty({ message: 'imageUrl không được để trống' })
  imageUrl;

  @ApiPropertyOptional({
    type: String,
    description: 'Mô tả thêm tình trạng sự cố (hoặc bản ghi âm giọng nói)',
    example: 'Aptomat tổng trong nhà bị nổ lép bép và bốc khói đen',
  })
  @IsOptional()
  @IsString({ message: 'description phải là chuỗi ký tự' })
  description;
}
