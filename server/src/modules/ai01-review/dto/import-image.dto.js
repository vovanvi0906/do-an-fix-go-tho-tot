import {IsString,IsIn,IsUUID,MaxLength,MinLength,IsBoolean,Equals,IsOptional} from 'class-validator';
import {ApiProperty,ApiPropertyOptional} from '@nestjs/swagger';
import {Transform} from 'class-transformer';
export class ImportImageDto {
 @ApiProperty() @IsUUID() uploadId;
 @ApiProperty() @IsUUID() categoryId;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) targetId='';
 @ApiProperty({enum:['own_photo','licensed','permission']}) @IsIn(['own_photo','licensed','permission']) sourceType;
 @ApiProperty() @IsString() @MinLength(3) @MaxLength(3000) sourceReference;
 @ApiProperty({enum:['owned','licensed','permission']}) @IsIn(['owned','licensed','permission']) rightsType;
 @ApiProperty() @IsString() @MinLength(3) @MaxLength(3000) rightsEvidence;
 @ApiProperty({description:'Mã cùng thiết bị/phiên chụp; dùng chung cho các ảnh liên quan'}) @IsString() @MinLength(3) @MaxLength(200) groupKey;
 @ApiProperty({description:'Xác nhận ảnh phát triển, không thuộc bộ test/benchmark độc lập'})
 @Transform(({value})=>value==='true'?true:value==='false'?false:value) @IsBoolean() @Equals(true) developmentOnly;
}
