import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsUUID, IsOptional, MaxLength, IsBoolean, Equals, IsObject, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
export class DatasetOptionsDto {
 @ApiPropertyOptional({type:String,enum:['auto','csv','jsonl']}) @IsIn(['auto','csv','jsonl']) metadataSource='auto';
 @ApiPropertyOptional({type:String,format:'uuid'}) @ValidateIf((_o,v)=>v!=='' && v!==undefined) @IsUUID() categoryId='';
 @ApiPropertyOptional({type:String}) @IsOptional() @IsString() @MaxLength(100) targetId='';
 @ApiPropertyOptional({type:String,enum:['','roboflow','own_photo','licensed','permission','synthetic_ai']}) @IsIn(['','roboflow','own_photo','licensed','permission','synthetic_ai']) sourceType='';
 @ApiPropertyOptional({type:String}) @IsString() @MaxLength(3000) sourceReference='';
 @ApiPropertyOptional({type:String,enum:['','owned','licensed','permission']}) @IsIn(['','owned','licensed','permission']) rightsType='';
 @ApiPropertyOptional({type:String}) @IsString() @MaxLength(3000) rightsEvidence='';
 @ApiPropertyOptional({type:String}) @IsString() @MaxLength(200) groupKey='';
 @ApiPropertyOptional({type:String}) @IsOptional() @IsString() @MaxLength(200) generatorTool='';
 @ApiPropertyOptional({type:String}) @IsOptional() @IsString() @MaxLength(40) generatedAt='';
 @ApiPropertyOptional({type:String}) @IsOptional() @IsString() @MaxLength(10000) prompt='';
 @ApiPropertyOptional({type:String,description:'Tên dataset hiển thị'}) @IsOptional() @IsString() @MaxLength(200) datasetName='';
 @ApiPropertyOptional({type:'object',additionalProperties:{type:'object',required:['kind','label'],properties:{kind:{type:'string',enum:['object','sign']},label:{type:'string'}}},description:'Mapping class YOLO sang kind object/sign và ID taxonomy/code dấu hiệu'})
 @IsOptional() @Transform(({value})=>{if(typeof value!=='string')return value;try{return JSON.parse(value);}catch{return value;}}) @IsObject() classMapping={};
 @ApiProperty({type:Boolean}) @Transform(({value})=>value==='true'?true:value==='false'?false:value) @IsBoolean() @Equals(true) developmentOnly;
}
