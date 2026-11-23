import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, IsInt, Min, Max, IsIn, IsUUID, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LabelBrowserQueryDto {
  @ApiPropertyOptional({default:1}) @Type(()=>Number) @IsInt() @Min(1) @Max(100000)
  page = 1;
  @ApiPropertyOptional({default:12,maximum:50}) @Type(()=>Number) @IsInt() @Min(1) @Max(50)
  pageSize = 12;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  q;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  category;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  target;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  status;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  dataset;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  sourceLabel;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  sign;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  labelType;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  quality;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  bbox;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  imageType;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  duplicate;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  queue;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  priority;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  usage;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  quick;
  @ApiPropertyOptional({enum:['id','status','priority']}) @IsOptional() @IsIn(['id','status','priority'])
  sort;
  @ApiPropertyOptional({enum:['asc','desc']}) @IsOptional() @IsIn(['asc','desc'])
  direction;
  @ApiPropertyOptional() @IsOptional() @IsUUID()
  queueId;
  @ApiPropertyOptional() @IsOptional() @Matches(/^img-\d{5}$/)
  imageId;
  @ApiPropertyOptional({enum:['next','previous']}) @IsOptional() @IsIn(['next','previous'])
  move;
}
