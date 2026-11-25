import { IsUUID, IsString, IsBoolean, IsIn, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AI01_ROLES } from '../ai01-policy';
export class RevokeAi01PermissionDto {
  @ApiProperty({type:String,description:'User FixGo đích; actor luôn lấy từ JWT'}) @IsUUID() targetUserId;
  @ApiProperty({type:String,description:'Lý do cấp/thu hồi quyền'}) @IsString() @MinLength(5) @MaxLength(2000) reason;
  @ApiProperty({type:String,description:'Revision policy người quản trị đã đọc'}) @Matches(/^[a-f0-9]{64}$/) expectedRevision;
}
export class GrantAi01PermissionDto extends RevokeAi01PermissionDto {
  @ApiProperty({type:String,enum:AI01_ROLES}) @IsIn(AI01_ROLES) role;
  @ApiProperty({type:Boolean,description:'Chuyên môn đã được người quản trị xác minh'}) @IsBoolean() expert;
}
