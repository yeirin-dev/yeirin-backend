import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@infrastructure/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { S3Service } from '@infrastructure/storage/s3.service';

/**
 * 파일 업로드 Controller
 * Presentation Layer - 파일 업로드 API 엔드포인트
 */
@ApiTags('파일 업로드')
@Controller('api/v1/upload')
export class UploadController {
  private readonly internalApiSecret: string;

  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {
    this.internalApiSecret =
      this.configService.get<string>('INTERNAL_API_SECRET') || 'yeirin-internal-secret';
  }

  /**
   * 내부 API 인증 검증
   */
  private validateInternalApiSecret(secret: string | undefined): void {
    if (!secret || secret !== this.internalApiSecret) {
      throw new UnauthorizedException('유효하지 않은 내부 API 키입니다');
    }
  }

  /**
   * 단일 이미지 업로드
   * 상담의뢰지 검사 결과 이미지 업로드용
   */
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('이미지 파일만 업로드 가능합니다 (jpg, jpeg, png, gif, webp)'),
            false,
          );
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
        url: {
          type: 'string',
          description: '파일 접근용 Presigned URL (1시간 유효)',
          example:
            'https://yeirin-uploads.s3.ap-northeast-2.amazonaws.com/counsel-requests/uuid.jpg?X-Amz-...',
        },
        key: {
          type: 'string',
          description: 'S3 객체 키 (DB 저장용)',
          example: 'counsel-requests/uuid.jpg',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 파일 형식 또는 크기 초과' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다');
    }

    const s3Url = await this.s3Service.uploadFile(file, 'counsel-requests');
    const key = this.s3Service.extractKeyFromUrl(s3Url);
    const url = await this.s3Service.getPresignedUrl(key);
    return { url, key };
  }

  /**
   * 여러 이미지 업로드 (최대 3개)
   * 검사 결과지 여러 장 동시 업로드용
   */
  @Post('images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      // 최대 3개
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('이미지 파일만 업로드 가능합니다 (jpg, jpeg, png, gif, webp)'),
            false,
          );
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
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'Presigned URL (1시간 유효)' },
              key: { type: 'string', description: 'S3 객체 키 (DB 저장용)' },
            },
          },
          example: [
            {
              url: 'https://yeirin-uploads.s3.../uuid1.jpg?X-Amz-...',
              key: 'counsel-requests/uuid1.jpg',
            },
            {
              url: 'https://yeirin-uploads.s3.../uuid2.jpg?X-Amz-...',
              key: 'counsel-requests/uuid2.jpg',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 파일 형식, 크기 초과, 또는 파일 개수 초과' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ files: Array<{ url: string; key: string }> }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('파일이 업로드되지 않았습니다');
    }

    if (files.length > 3) {
      throw new BadRequestException('최대 3개의 파일만 업로드할 수 있습니다');
    }

    const s3Urls = await this.s3Service.uploadFiles(files, 'counsel-requests');
    const results = await Promise.all(
      s3Urls.map(async (s3Url) => {
        const key = this.s3Service.extractKeyFromUrl(s3Url);
        const url = await this.s3Service.getPresignedUrl(key);
        return { url, key };
      }),
    );
    return { files: results };
  }

  /**
   * 내부 서비스용 PDF 업로드 (MSA 통신용)
   * yeirin-ai에서 호출하여 KPRC 검사 결과 PDF를 업로드합니다.
   * JWT 인증 대신 내부 API 키로 인증합니다.
   */
  @Public()
  @Post('internal/pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB (PDF는 크기가 클 수 있음)
      },
      fileFilter: (req, file, callback) => {
        if (file.mimetype !== 'application/pdf') {
          return callback(new BadRequestException('PDF 파일만 업로드 가능합니다'), false);
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '내부 서비스용 PDF 업로드 (MSA 통신)',
    description:
      'yeirin-ai에서 KPRC 검사 결과 PDF를 업로드할 때 사용합니다. JWT 인증 대신 X-Internal-Api-Key 헤더로 인증합니다.',
  })
  @ApiHeader({
    name: 'X-Internal-Api-Key',
    description: '내부 서비스 API 키',
    required: true,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '업로드할 PDF 파일 (최대 20MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'PDF 업로드 성공',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Presigned URL (1시간 유효)',
          example:
            'https://yeirin-uploads.s3.ap-northeast-2.amazonaws.com/assessment-reports/uuid.pdf?X-Amz-...',
        },
        key: {
          type: 'string',
          description: 'S3 객체 키 (DB 저장용)',
          example: 'assessment-reports/uuid.pdf',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 파일 형식 또는 크기 초과' })
  @ApiResponse({ status: 401, description: '내부 API 키 인증 실패' })
  async uploadInternalPdf(
    @UploadedFile() file: Express.Multer.File,
    @Headers('X-Internal-Api-Key') apiKey: string,
  ): Promise<{ url: string; key: string }> {
    // 내부 API 키 검증
    this.validateInternalApiSecret(apiKey);

    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다');
    }

    // assessment-reports 폴더에 저장
    const s3Url = await this.s3Service.uploadFile(file, 'assessment-reports');
    const key = this.s3Service.extractKeyFromUrl(s3Url);
    const url = await this.s3Service.getPresignedUrl(key);
    return { url, key };
  }

  /**
   * 내부 서비스용 Presigned URL 생성 (MSA 통신용)
   * yeirin-ai에서 S3 객체에 접근할 때 사용합니다.
   */
  @Public()
  @Post('internal/presigned-url')
  @ApiOperation({
    summary: '내부 서비스용 Presigned URL 생성 (MSA 통신)',
    description:
      'yeirin-ai에서 S3 객체에 접근할 때 사용합니다. JWT 인증 대신 X-Internal-Api-Key 헤더로 인증합니다.',
  })
  @ApiHeader({
    name: 'X-Internal-Api-Key',
    description: '내부 서비스 API 키',
    required: true,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'S3 객체 키',
          example: 'assessment-reports/uuid.pdf',
        },
        expiresIn: {
          type: 'number',
          description: 'URL 유효 시간 (초, 기본 3600)',
          example: 3600,
        },
      },
      required: ['key'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Presigned URL 생성 성공',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Presigned URL' },
      },
    },
  })
  @ApiResponse({ status: 401, description: '내부 API 키 인증 실패' })
  async getInternalPresignedUrl(
    @Body() body: { key: string; expiresIn?: number },
    @Headers('X-Internal-Api-Key') apiKey: string,
  ): Promise<{ url: string }> {
    // 내부 API 키 검증
    this.validateInternalApiSecret(apiKey);

    const { key, expiresIn = 3600 } = body;
    if (!key) {
      throw new BadRequestException('S3 키가 필요합니다');
    }
    const url = await this.s3Service.getPresignedUrl(key, expiresIn);
    return { url };
  }

  /**
   * S3 키로 Presigned URL 생성
   * DB에 저장된 S3 키를 이용해 파일 접근 URL 생성
   */
  @Post('presigned-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'S3 키로 Presigned URL 생성' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'S3 객체 키',
          example: 'counsel-requests/uuid.jpg',
        },
        expiresIn: {
          type: 'number',
          description: 'URL 유효 시간 (초, 기본 3600)',
          example: 3600,
        },
      },
      required: ['key'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Presigned URL 생성 성공',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Presigned URL' },
      },
    },
  })
  async getPresignedUrl(
    @Body() body: { key: string; expiresIn?: number },
  ): Promise<{ url: string }> {
    const { key, expiresIn = 3600 } = body;
    if (!key) {
      throw new BadRequestException('S3 키가 필요합니다');
    }
    const url = await this.s3Service.getPresignedUrl(key, expiresIn);
    return { url };
  }
}
