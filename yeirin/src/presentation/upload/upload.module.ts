import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from '@infrastructure/storage/s3.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [S3Service],
  exports: [S3Service],
})
export class UploadModule {}
