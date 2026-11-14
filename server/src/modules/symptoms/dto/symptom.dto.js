import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  IsIn,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
export class CreateSymptomDto {
  @ApiProperty({ type: String }) @IsString() @IsNotEmpty() targetId;
  @ApiProperty({ type: String })
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{1,79}$/, {
    message: 'Code gồm chữ thường, số và dấu gạch dưới.',
  })
  code;
  @ApiProperty({ type: String }) @IsString() @IsNotEmpty() @MaxLength(200) name;
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  aliases;
  @ApiPropertyOptional({
    type: String,
    enum: ['USER_REPORTED', 'VISUAL_OBSERVABLE', 'REQUIRES_TECHNICIAN_CHECK'],
  })
  @IsOptional()
  @IsIn(['USER_REPORTED', 'VISUAL_OBSERVABLE', 'REQUIRES_TECHNICIAN_CHECK'])
  kind;
  @ApiPropertyOptional({
    type: String,
    enum: ['NEEDS_REVIEW', 'APPROVED', 'REJECTED'],
  })
  @IsOptional()
  @IsIn(['NEEDS_REVIEW', 'APPROVED', 'REJECTED'])
  reviewStatus;
  @ApiPropertyOptional({ type: Boolean }) @IsOptional() @IsBoolean() isActive;
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  sortOrder;
}
export class UpdateSymptomDto extends PartialType(CreateSymptomDto) {}
export class SymptomMappingDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  priority;
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason;
  @ApiPropertyOptional({ type: Boolean }) @IsOptional() @IsBoolean() isActive;
  @ApiPropertyOptional({
    type: String,
    enum: ['NEEDS_REVIEW', 'APPROVED', 'REJECTED'],
  })
  @IsOptional()
  @IsIn(['NEEDS_REVIEW', 'APPROVED', 'REJECTED'])
  reviewStatus;
}
