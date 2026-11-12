import { IsBoolean, IsNotEmpty, IsOptional, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAvailabilityDto {
  @ApiProperty({ type: Boolean, description: 'Bật hoặc tắt nhận đơn' })
  @IsNotEmpty({ message: 'isOnline không được để trống' })
  @IsBoolean({ message: 'isOnline phải là boolean (true/false)' })
  isOnline;

  @ApiPropertyOptional({ type: Number, description: 'Vĩ độ GPS hiện tại, bắt buộc khi bật online' })
  @IsOptional()
  @IsLatitude({ message: 'Vĩ độ không hợp lệ' })
  lat;

  @ApiPropertyOptional({ type: Number, description: 'Kinh độ GPS hiện tại, bắt buộc khi bật online' })
  @IsOptional()
  @IsLongitude({ message: 'Kinh độ không hợp lệ' })
  lng;
}
