import { IsString, IsIn, Equals, IsOptional, IsUUID, MaxLength, IsISO8601, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class FaceConsentDto {
  @ApiProperty({ type: Boolean, enum: [true] }) @Equals(true, { message: 'Vui lòng đồng ý sử dụng dữ liệu sinh trắc học' }) consent;
  @ApiProperty({ type: String }) @IsString() @MaxLength(128) version;
}
export class FaceSessionDto {
  @ApiProperty({ enum: ['ENROLLMENT','DAILY','ORDER'] }) @IsIn(['ENROLLMENT','DAILY','ORDER']) purpose;
  @ApiPropertyOptional({ type: String }) @IsOptional() @IsUUID() orderId;
  @ApiProperty({ type: String, description: 'UUID do client tạo, giữ nguyên khi retry' }) @IsUUID() requestKey;
}
export class FaceCaptureDto {
  @ApiProperty({ type: String }) @IsString() @MaxLength(128) nonce;
  @ApiProperty({ type: String, description: 'Ảnh camera inline, không nhận URL hoặc embedding' })
  @IsString() @MaxLength(90000) @Matches(/^data:image\/(jpeg|png);base64,/) photo;
}
export class FaceReviewDto {
  @ApiProperty({ type: Boolean }) @Equals(true) reviewedIdentity;
  @ApiProperty({ enum: ['ENROLLMENT','REENROLLMENT'] }) @IsIn(['ENROLLMENT','REENROLLMENT']) kind;
  @ApiProperty({ type: String }) @IsString() @Matches(/^[a-zA-Z0-9:_-]{1,128}$/) evidenceReference;
  @ApiProperty({ type: String }) @Matches(/^[a-f0-9]{64}$/) evidenceDigest;
  @ApiProperty({ type: String }) @IsString() @MaxLength(160) reason;
  @ApiProperty({ type: String }) @IsISO8601() expiresAt;
}
export class FaceUploadDto {
  @ApiProperty({ type: String }) @IsString() @MaxLength(128) nonce;
}
