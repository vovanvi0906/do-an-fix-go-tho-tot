import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustPriceDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Số tiền chi phí phát sinh thêm (VNĐ) khi thợ kiểm tra hiện trường',
    example: 120000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'additionalPrice phải là số nguyên hoặc số thực' })
  @Min(0, { message: 'additionalPrice không được âm' })
  additionalPrice;

  @ApiPropertyOptional({
    type: String,
    description: 'Lý do phát sinh chi phí ngoài báo giá ban đầu (vd: thay linh kiện tụ block quạt)',
    example: 'Thay tụ kích block điều hòa bị cháy rò điện',
  })
  @IsOptional()
  @IsString({ message: 'reason phải là chuỗi ký tự' })
  reason;

  @ApiPropertyOptional({
    type: String,
    description: 'URL ảnh minh chứng sự cố/linh kiện hỏng hóc phát sinh',
    example: 'https://fixgo.com/uploads/issue-component.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl;

  @ApiPropertyOptional({
    type: String,
    description: 'Hành động duyệt chi phí: PROPOSE (Thợ đề xuất), ACCEPT (Khách duyệt), REJECT (Khách từ chối)',
    enum: ['PROPOSE', 'ACCEPT', 'REJECT'],
    example: 'PROPOSE',
  })
  @IsOptional()
  @IsIn(['PROPOSE', 'ACCEPT', 'REJECT'], {
    message: 'action phải là PROPOSE, ACCEPT hoặc REJECT',
  })
  action;

  @ApiPropertyOptional({
    type: String,
    description: 'Ghi chú phản hồi từ khách hàng khi chấp nhận hoặc từ chối',
    example: 'Đồng ý thay thế linh kiện chính hãng',
  })
  @IsOptional()
  @IsString()
  note;
}
