
import { Controller, Get, Post, Body, Param, Logger, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CmsService } from './cms.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IpWhitelistGuard } from '../auth/guards/ip-whitelist.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('cms')
@Controller('cms')
export class CmsController {
  private readonly logger = new Logger(CmsController.name);

  constructor(private readonly cmsService: CmsService) { }

  @Get('health')
  @ApiOperation({ summary: 'Health check for CMS module' })
  health() {
    return { status: 'ok', module: 'cms' };
  }

  @Get('/')
  @ApiOperation({ summary: 'Get all content blocks' })
  getAll() {
    return this.cmsService.getAllContent();
  }

  @Get(':key')
  getOne(@Param('key') key: string) {
    return this.cmsService.getContent(key);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.BLOG_MANAGER)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = uuidv4();
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    }
  }))
  @ApiOperation({ summary: 'Upload an image' })
  uploadFile(@UploadedFile() file: any) {
    if (!file) throw new Error('File upload failed');
    // Return the URL
    // Assuming the server is running on the same host/port and /uploads is served statically
    return { url: `/uploads/${file.filename}` };
  }

  @Post(':key')
  @ApiOperation({ summary: 'Update a content block' })
  @UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BLOG_MANAGER)
  @ApiBearerAuth()
  update(@Param('key') key: string, @Body() data: any, @Req() req: any) {
    this.logger.log(`Received update request for key: ${key}`);
    const user = req?.user;
    if (user) {
      this.logger.log(`Auth user: role=${user.role} email=${user.email}`);
    }
    return this.cmsService.updateContent(key, data);
  }

  @Post('redirects/import')
  @UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.BLOG_MANAGER)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/temp',
      filename: (req, file, cb) => {
        const randomName = uuidv4();
        cb(null, `import-${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  @ApiOperation({ summary: 'Import redirects from CSV' })
  async importRedirects(@UploadedFile() file: any) {
    if (!file) throw new Error('CSV file upload failed');
    return this.cmsService.importRedirectsFromCsv(file.path);
  }
}
