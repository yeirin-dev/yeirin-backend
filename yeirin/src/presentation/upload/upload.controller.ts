import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { S3Service } from '@infrastructure/storage/s3.service';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';

/**
 * 파일 업로드 Controller
 * Presentation Layer - 파일 업로드 API 엔드포인트
 */
@ApiTags('파일 업로드')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly s3Service: S3Service) {}

  /**
   * 단일 이미지 업로드
   * 상담의뢰지 검사 결과 이미지 업로드용
   */
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new BadRequestException('이미지 파일만 업로드 가능합니다 (jpg, jpeg, png, gif, webp)'), false);
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '단일 이미지 업로드 (검사 결과지용)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '업로드할 이미지 파일 (최대 5MB, jpg/jpeg/png/gif/webp)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '이미지 업로드 성공',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'https://yeirin-counsel-requests.s3.ap-northeast-2.amazonaws.com/counsel-requests/uuid.jpg' },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 파일 형식 또는 크기 초과' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다');
    }

    const url = await this.s3Service.uploadFile(file, 'counsel-requests');
    return { url };
  }

  /**
   * 여러 이미지 업로드 (최대 3개)
   * 검사 결과지 여러 장 동시 업로드용
   */
  @Post('images')
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      // 최대 3개
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new BadRequestException('이미지 파일만 업로드 가능합니다 (jpg, jpeg, png, gif, webp)'), false);
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '여러 이미지 동시 업로드 (최대 3개)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: '업로드할 이미지 파일들 (최대 3개, 각 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '이미지 업로드 성공',
    schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'https://yeirin-counsel-requests.s3.ap-northeast-2.amazonaws.com/counsel-requests/uuid1.jpg',
            'https://yeirin-counsel-requests.s3.ap-northeast-2.amazonaws.com/counsel-requests/uuid2.jpg',
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 파일 형식, 크기 초과, 또는 파일 개수 초과' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('파일이 업로드되지 않았습니다');
    }

    if (files.length > 3) {
      throw new BadRequestException('최대 3개의 파일만 업로드할 수 있습니다');
    }

    const urls = await this.s3Service.uploadFiles(files, 'counsel-requests');
    return { urls };
  }
}
