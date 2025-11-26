import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * AWS S3 파일 업로드 서비스
 * Infrastructure Layer - 외부 저장소 인터페이스
 */
@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly baseUrl: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');
    const forcePathStyle = this.configService.get<string>('AWS_S3_FORCE_PATH_STYLE') === 'true';

    this.s3Client = new S3Client({
      region: this.configService.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
      // MinIO 로컬 개발 환경 지원
      ...(endpoint && { endpoint }),
      forcePathStyle, // MinIO는 path-style URL 필요
    });
    this.bucketName = this.configService.getOrThrow<string>('AWS_S3_BUCKET_NAME');
    this.baseUrl = this.configService.getOrThrow<string>('AWS_S3_BASE_URL');

    this.logger.log(
      `S3 서비스 초기화 완료 - Bucket: ${this.bucketName}, Endpoint: ${endpoint || 'AWS S3'}`,
    );
  }

  /**
   * 파일 업로드 (단일 파일)
   * @param file - Multer 파일 객체
   * @param folder - S3 내 저장 폴더 경로 (예: 'counsel-requests', 'profiles')
   * @returns 업로드된 파일의 URL
   */
  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          // ACL: 'public-read', // 공개 읽기 권한 (버킷 정책에 따라 조정)
        },
      });

      await upload.done();

      const fileUrl = `${this.baseUrl}/${fileName}`;
      this.logger.log(`파일 업로드 성공: ${fileUrl}`);

      return fileUrl;
    } catch (error) {
      this.logger.error(`파일 업로드 실패: ${error.message}`, error.stack);
      throw new Error(`파일 업로드 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 여러 파일 업로드 (동시 처리)
   * @param files - Multer 파일 객체 배열
   * @param folder - S3 내 저장 폴더 경로
   * @returns 업로드된 파일들의 URL 배열
   */
  async uploadFiles(files: Express.Multer.File[], folder: string = 'uploads'): Promise<string[]> {
    try {
      const uploadPromises = files.map((file) => this.uploadFile(file, folder));
      const urls = await Promise.all(uploadPromises);

      this.logger.log(`${files.length}개 파일 업로드 성공`);
      return urls;
    } catch (error) {
      this.logger.error(`여러 파일 업로드 실패: ${error.message}`, error.stack);
      throw new Error(`파일 업로드 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 파일 삭제
   * @param fileUrl - 삭제할 파일의 전체 URL
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // URL에서 Key 추출 (baseUrl 이후 부분)
      const key = fileUrl.replace(`${this.baseUrl}/`, '');

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`파일 삭제 성공: ${fileUrl}`);
    } catch (error) {
      this.logger.error(`파일 삭제 실패: ${error.message}`, error.stack);
      throw new Error(`파일 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 여러 파일 삭제 (동시 처리)
   * @param fileUrls - 삭제할 파일들의 URL 배열
   */
  async deleteFiles(fileUrls: string[]): Promise<void> {
    try {
      const deletePromises = fileUrls.map((url) => this.deleteFile(url));
      await Promise.all(deletePromises);

      this.logger.log(`${fileUrls.length}개 파일 삭제 성공`);
    } catch (error) {
      this.logger.error(`여러 파일 삭제 실패: ${error.message}`, error.stack);
      throw new Error(`파일 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  }
}
