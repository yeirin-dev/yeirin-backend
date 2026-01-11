/**
 * AWS S3 / MinIO Mock
 *
 * 파일 업로드/다운로드 테스트용 Mock
 */

/**
 * S3 업로드 응답 인터페이스
 */
export interface S3UploadResponse {
  key: string;
  url: string;
  bucket: string;
  etag?: string;
  size?: number;
}

/**
 * Presigned URL 응답 인터페이스
 */
export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  expiresAt: Date;
}

/**
 * Mock 파일 저장소
 */
interface MockFile {
  key: string;
  content: Buffer | string;
  contentType: string;
  uploadedAt: Date;
  metadata?: Record<string, string>;
}

/**
 * S3 Mock 서비스
 */
export class S3Mock {
  private files: Map<string, MockFile> = new Map();
  private shouldFail = false;
  private failOnKey: string | null = null;
  private callLog: Array<{ method: string; args: unknown[] }> = [];
  private bucketName = 'yeirin-test-bucket';
  private baseUrl = 'https://test-bucket.s3.amazonaws.com';

  /**
   * 파일 업로드 Mock
   */
  async upload(
    key: string,
    content: Buffer | string,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<S3UploadResponse> {
    this.callLog.push({ method: 'upload', args: [key, content, options] });

    if (this.shouldFail || this.failOnKey === key) {
      throw new Error('S3 업로드 실패');
    }

    const file: MockFile = {
      key,
      content,
      contentType: options?.contentType || 'application/octet-stream',
      uploadedAt: new Date(),
      metadata: options?.metadata,
    };

    this.files.set(key, file);

    return {
      key,
      url: `${this.baseUrl}/${key}`,
      bucket: this.bucketName,
      etag: `"${this.generateEtag()}"`,
      size: typeof content === 'string' ? content.length : content.length,
    };
  }

  /**
   * 이미지 업로드 Mock
   */
  async uploadImage(
    key: string,
    imageBuffer: Buffer,
    mimeType = 'image/jpeg',
  ): Promise<S3UploadResponse> {
    return this.upload(key, imageBuffer, { contentType: mimeType });
  }

  /**
   * PDF 업로드 Mock
   */
  async uploadPdf(key: string, pdfBuffer: Buffer): Promise<S3UploadResponse> {
    return this.upload(key, pdfBuffer, { contentType: 'application/pdf' });
  }

  /**
   * 파일 다운로드 Mock
   */
  async download(key: string): Promise<Buffer | string | null> {
    this.callLog.push({ method: 'download', args: [key] });

    if (this.shouldFail) {
      throw new Error('S3 다운로드 실패');
    }

    const file = this.files.get(key);
    return file?.content || null;
  }

  /**
   * 파일 존재 여부 확인
   */
  async exists(key: string): Promise<boolean> {
    this.callLog.push({ method: 'exists', args: [key] });

    if (this.shouldFail) {
      throw new Error('S3 확인 실패');
    }

    return this.files.has(key);
  }

  /**
   * 파일 삭제 Mock
   */
  async delete(key: string): Promise<boolean> {
    this.callLog.push({ method: 'delete', args: [key] });

    if (this.shouldFail) {
      throw new Error('S3 삭제 실패');
    }

    return this.files.delete(key);
  }

  /**
   * Presigned URL 생성 Mock
   */
  async getPresignedUrl(
    key: string,
    expiresInSeconds = 3600,
  ): Promise<PresignedUrlResponse> {
    this.callLog.push({ method: 'getPresignedUrl', args: [key, expiresInSeconds] });

    if (this.shouldFail) {
      throw new Error('Presigned URL 생성 실패');
    }

    return {
      uploadUrl: `${this.baseUrl}/${key}?X-Amz-Signature=mock-signature&X-Amz-Expires=${expiresInSeconds}`,
      key,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  /**
   * 파일 URL 생성
   */
  getFileUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }

  /**
   * 실패 설정
   */
  setFail(shouldFail: boolean): this {
    this.shouldFail = shouldFail;
    return this;
  }

  /**
   * 특정 키에서만 실패하도록 설정
   */
  setFailOnKey(key: string | null): this {
    this.failOnKey = key;
    return this;
  }

  /**
   * 저장된 파일 조회
   */
  getFile(key: string): MockFile | undefined {
    return this.files.get(key);
  }

  /**
   * 모든 파일 조회
   */
  getAllFiles(): MockFile[] {
    return Array.from(this.files.values());
  }

  /**
   * 호출 로그 조회
   */
  getCallLog(): Array<{ method: string; args: unknown[] }> {
    return [...this.callLog];
  }

  /**
   * 특정 메서드 호출 횟수 조회
   */
  getCallCount(method?: string): number {
    if (method) {
      return this.callLog.filter((log) => log.method === method).length;
    }
    return this.callLog.length;
  }

  /**
   * Mock 상태 리셋
   */
  reset(): void {
    this.files.clear();
    this.shouldFail = false;
    this.failOnKey = null;
    this.callLog = [];
  }

  /**
   * ETag 생성 헬퍼
   */
  private generateEtag(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

/**
 * 전역 Mock 인스턴스
 */
export const s3Mock = new S3Mock();

/**
 * Jest Mock Factory
 */
export function createS3Mock() {
  return {
    upload: jest.fn().mockImplementation((key: string, content: Buffer | string, options?: unknown) =>
      s3Mock.upload(key, content, options as { contentType?: string; metadata?: Record<string, string> }),
    ),
    uploadImage: jest.fn().mockImplementation((key: string, buffer: Buffer, mimeType?: string) =>
      s3Mock.uploadImage(key, buffer, mimeType),
    ),
    uploadPdf: jest.fn().mockImplementation((key: string, buffer: Buffer) =>
      s3Mock.uploadPdf(key, buffer),
    ),
    download: jest.fn().mockImplementation((key: string) => s3Mock.download(key)),
    exists: jest.fn().mockImplementation((key: string) => s3Mock.exists(key)),
    delete: jest.fn().mockImplementation((key: string) => s3Mock.delete(key)),
    getPresignedUrl: jest.fn().mockImplementation((key: string, expires?: number) =>
      s3Mock.getPresignedUrl(key, expires),
    ),
    getFileUrl: jest.fn().mockImplementation((key: string) => s3Mock.getFileUrl(key)),
  };
}

/**
 * NestJS Provider Mock
 */
export const S3MockProvider = {
  provide: 'S3Service',
  useValue: createS3Mock(),
};

/**
 * 테스트용 파일 생성 헬퍼
 */
export const mockFileFactories = {
  /**
   * 이미지 Buffer 생성 (1x1 PNG)
   */
  createImageBuffer: (): Buffer => {
    // 최소 크기의 유효한 PNG
    return Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
  },

  /**
   * PDF Buffer 생성 (최소 PDF)
   */
  createPdfBuffer: (): Buffer => {
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer
<< /Size 4 /Root 1 0 R >>
startxref
193
%%EOF`;
    return Buffer.from(pdfContent);
  },

  /**
   * 텍스트 파일 생성
   */
  createTextFile: (content = '테스트 파일 내용'): Buffer => {
    return Buffer.from(content, 'utf-8');
  },

  /**
   * 지정 크기 파일 생성
   */
  createFileOfSize: (sizeInBytes: number): Buffer => {
    return Buffer.alloc(sizeInBytes, 'x');
  },
};
