import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsObject, IsString, IsUUID, ValidateNested } from 'class-validator';
import { ConsentStatus } from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import {
  BasicInfoDto,
  CoverInfoDto,
  PsychologicalInfoDto,
  RequestMotivationDto,
  TestResultsDto,
} from './create-counsel-request.dto';

/**
 * 소울이 Webhook DTO
 * 소울이에서 상담의뢰지를 자동 생성할 때 사용
 */
export class SouliWebhookDto {
  @ApiProperty({ description: '소울이 세션 ID (추적용)', example: 'souli-session-12345' })
  @IsString()
  @IsNotEmpty()
  souliSessionId: string;

  @ApiProperty({ description: '아동 ID (UUID)' })
  @IsUUID()
  childId: string;

  @ApiProperty({ description: '보호자 ID (UUID)' })
  @IsUUID()
  guardianId: string;

  @ApiProperty({ description: '표지 정보' })
  @IsObject()
  @ValidateNested()
  @Type(() => CoverInfoDto)
  coverInfo: CoverInfoDto;

  @ApiProperty({ description: '기본 정보' })
  @IsObject()
  @ValidateNested()
  @Type(() => BasicInfoDto)
  basicInfo: BasicInfoDto;

  @ApiProperty({ description: '정서·심리 관련 정보' })
  @IsObject()
  @ValidateNested()
  @Type(() => PsychologicalInfoDto)
  psychologicalInfo: PsychologicalInfoDto;

  @ApiProperty({ description: '의뢰 동기 및 상담 목표' })
  @IsObject()
  @ValidateNested()
  @Type(() => RequestMotivationDto)
  requestMotivation: RequestMotivationDto;

  @ApiProperty({ description: '소울이 검사 결과지' })
  @IsObject()
  @ValidateNested()
  @Type(() => TestResultsDto)
  testResults: TestResultsDto;

  @ApiProperty({ description: '보호자 동의 여부', enum: ConsentStatus })
  @IsEnum(ConsentStatus)
  consent: ConsentStatus;
}
