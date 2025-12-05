import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  CareType,
  ConsentStatus,
  Gender,
  PriorityReason,
} from '@domain/counsel-request/model/value-objects/counsel-request-enums';

// ============================================
// Sub DTOs
// ============================================

export class RequestDateDto {
  @ApiProperty({ description: '년', example: 2024 })
  @IsInt()
  year: number;

  @ApiProperty({ description: '월', example: 11, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: '일', example: 18, minimum: 1, maximum: 31 })
  @IsInt()
  @Min(1)
  @Max(31)
  day: number;
}

export class CoverInfoDto {
  @ApiProperty({ description: '의뢰 일자' })
  @ValidateNested()
  @Type(() => RequestDateDto)
  requestDate: RequestDateDto;

  @ApiProperty({ description: '센터명', example: '서울아동발달센터' })
  @IsString()
  @IsNotEmpty()
  centerName: string;

  @ApiProperty({ description: '담당자 이름', example: '홍길동' })
  @IsString()
  @IsNotEmpty()
  counselorName: string;
}

export class ChildInfoDto {
  @ApiProperty({ description: '아동 이름', example: '김철수' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '성별', enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ description: '연령', example: 7 })
  @IsInt()
  @Min(0)
  age: number;

  @ApiProperty({ description: '학년', example: '초1' })
  @IsString()
  grade: string;
}

export class BasicInfoDto {
  @ApiProperty({ description: '아동 정보' })
  @ValidateNested()
  @Type(() => ChildInfoDto)
  childInfo: ChildInfoDto;

  @ApiProperty({ description: '센터 이용 기준', enum: CareType, example: CareType.PRIORITY })
  @IsEnum(CareType)
  careType: CareType;

  @ApiProperty({
    description: '우선돌봄 세부 사유 (careType이 PRIORITY일 때 필수)',
    enum: PriorityReason,
    required: false,
  })
  @IsEnum(PriorityReason)
  @IsOptional()
  priorityReason?: PriorityReason;
}

export class PsychologicalInfoDto {
  @ApiProperty({ description: '기존 아동 병력', example: 'ADHD 진단 받음 (2023년)' })
  @IsString()
  medicalHistory: string;

  @ApiProperty({ description: '병력 외 특이사항', example: '학교 적응에 어려움' })
  @IsString()
  specialNotes: string;
}

export class RequestMotivationDto {
  @ApiProperty({ description: '의뢰 동기', example: '학교에서 집중하지 못하고 자주 다툼' })
  @IsString()
  @IsNotEmpty()
  motivation: string;

  @ApiProperty({ description: '보호자 및 의뢰자의 목표', example: '자기 조절 능력 향상' })
  @IsString()
  @IsNotEmpty()
  goals: string;
}

export class TestResultsDto {
  @ApiProperty({ description: '아동 반응척도 심리검사 (이미지 URL)', required: false })
  @IsString()
  @IsOptional()
  childReactionScale?: string;

  @ApiProperty({ description: '강점 설문지 심리검사 (이미지 URL)', required: false })
  @IsString()
  @IsOptional()
  strengthSurvey?: string;

  @ApiProperty({ description: '난점 설문지 심리검사 (이미지 URL)', required: false })
  @IsString()
  @IsOptional()
  difficultySurvey?: string;

  @ApiProperty({
    description: 'Soul-E KPRC 심리검사 결과 PDF URL (S3)',
    required: false,
    example: 'https://s3.amazonaws.com/bucket/assessment-reports/result-123.pdf',
  })
  @IsString()
  @IsOptional()
  assessmentReportUrl?: string;
}

// ============================================
// Main DTO
// ============================================

export class CreateCounselRequestDto {
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
