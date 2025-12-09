import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    // 로컬 개발 환경(MinIO)에서는 명시적 자격증명 사용
    // EC2 환경에서는 IAM Role 자동 사용 (credentials 생략 시 SDK가 자동 탐지)
    const credentials =
      accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined;

    this.s3Client = new S3Client({
      region: this.configService.getOrThrow<string>('AWS_REGION'),
      ...(credentials && { credentials }),
      // MinIO 로컬 개발 환경 지원
      ...(endpoint && { endpoint }),
      forcePathStyle, // MinIO는 path-style URL 필요
    });
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME') || 'yeirin-uploads';
    this.baseUrl =
      this.configService.get<string>('AWS_S3_BASE_URL') ||
      `https://${this.bucketName}.s3.${this.configService.getOrThrow<string>('AWS_REGION')}.amazonaws.com`;

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

  /**
   * Presigned URL 생성 (파일 조회용)
   * S3 Public Access가 차단된 경우 임시 서명 URL로 파일 접근
   * @param key - S3 객체 키 (폴더/파일명)
   * @param expiresIn - URL 유효 시간 (초, 기본 1시간)
   * @returns Presigned URL
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      this.logger.debug(`Presigned URL 생성: ${key} (유효시간: ${expiresIn}초)`);

      return presignedUrl;
    } catch (error) {
      this.logger.error(`Presigned URL 생성 실패: ${error.message}`, error.stack);
      throw new Error(`Presigned URL 생성 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 파일 URL에서 Presigned URL 생성
   * @param fileUrl - 기존 S3 파일 URL
   * @param expiresIn - URL 유효 시간 (초, 기본 1시간)
   * @returns Presigned URL
   */
  async getPresignedUrlFromFileUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
    const key = this.extractKeyFromUrl(fileUrl);
    return this.getPresignedUrl(key, expiresIn);
  }

  /**
   * 여러 파일 URL에서 Presigned URL 일괄 생성
   * @param fileUrls - 기존 S3 파일 URL 배열
   * @param expiresIn - URL 유효 시간 (초, 기본 1시간)
   * @returns Presigned URL 배열
   */
  async getPresignedUrls(fileUrls: string[], expiresIn: number = 3600): Promise<string[]> {
    const promises = fileUrls.map((url) => this.getPresignedUrlFromFileUrl(url, expiresIn));
    return Promise.all(promises);
  }

  /**
   * 파일 URL에서 S3 Key 추출
   * @param fileUrl - S3 파일 URL
   * @returns S3 객체 키
   */
  extractKeyFromUrl(fileUrl: string): string {
    // baseUrl 형식: https://bucket.s3.region.amazonaws.com 또는 커스텀
    // URL 형식: https://bucket.s3.region.amazonaws.com/folder/file.ext
    return fileUrl.replace(`${this.baseUrl}/`, '');
  }
}
