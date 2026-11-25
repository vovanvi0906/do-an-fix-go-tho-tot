import { IsObject, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class ReviewActionDto {
  @ApiProperty({ description: 'Nội dung quyết định review; danh tính lấy từ JWT, không chấp nhận reviewerId/role.', type: Object })
  @IsDefined({ message: 'Cần nội dung quyết định review.' })
  @IsObject({ message: 'Nội dung quyết định phải là object.' })
  payload;
}
