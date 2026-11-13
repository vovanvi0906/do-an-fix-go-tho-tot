import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class ResearchSessionDto {
  @ApiProperty({enum:['ENROLLMENT','DAILY','ORDER']}) @IsIn(['ENROLLMENT','DAILY','ORDER'],{message:'Mục đích phiên nghiên cứu không hợp lệ'}) purpose;
  @ApiProperty() @IsUUID('4',{message:'Mã yêu cầu không hợp lệ'}) requestKey;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(128) orderId;
}
export class ResearchSyntheticDto {
  @ApiProperty() @IsString() @MaxLength(128) nonce;
}
