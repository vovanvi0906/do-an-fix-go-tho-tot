import { Ai01AuthConfigurationGuard } from './ai01-auth-configuration.guard';
import {Controller,Get,Post,Req,Query,Body,Bind,UseGuards,Dependencies} from '@nestjs/common';
import {ApiTags,ApiBearerAuth,ApiOperation,ApiBody} from '@nestjs/swagger';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {RolesGuard} from '../auth/guards/roles.guard';
import {Roles} from '../auth/decorators/roles.decorator';
import {Ai01PermissionsService} from './ai01-permissions.service';
import {GrantAi01PermissionDto,RevokeAi01PermissionDto} from './dto/ai01-permission.dto';
@ApiTags('admin-ai01-permissions') @ApiBearerAuth() @Controller('admin/ai01/permissions') @UseGuards(JwtAuthGuard,RolesGuard,Ai01AuthConfigurationGuard) @Roles('ADMIN') @Dependencies(Ai01PermissionsService)
export class Ai01PermissionsController {
 constructor(service){this.service=service;}
 @Get() @ApiOperation({summary:'Tài khoản Admin thật và vai trò AI; ADMIN active, không cần bootstrap'}) @Bind(Req(),Query())
 async list(req,query){return {success:true,data:await this.service.list(req.user,query)};}
 @Post('grant') @ApiOperation({summary:'Cấp vai trò AI cho user khác, không tự cấp, không đổi DB'}) @ApiBody({type:GrantAi01PermissionDto}) @Bind(Req(),Body())
 async grant(req,body){return {success:true,data:await this.service.change(req.user,'grant',body)};}
 @Post('revoke') @ApiOperation({summary:'Thu hồi vai trò AI, giữ nguyên lịch sử'}) @ApiBody({type:RevokeAi01PermissionDto}) @Bind(Req(),Body())
 async revoke(req,body){return {success:true,data:await this.service.change(req.user,'revoke',body)};}
}
