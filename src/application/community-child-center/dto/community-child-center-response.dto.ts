import { ApiProperty } from '@nestjs/swagger';

/**
 * 지역아동센터 응답 DTO
 */
export class CommunityChildCenterResponseDto {
  @ApiProperty({
    description: '기관 ID',
    example: '93dfda2d-6cd3-4e86-8259-ee1c098234f7',
  })
  id: string;

  @ApiProperty({
    description: '기관명',
    example: '행복지역아동센터',
  })
  name: string;

  @ApiProperty({
    description: '주소',
    example: '서울특별시 마포구 상암로 123',
  })
  address: string;

  @ApiProperty({
    description: '상세주소',
    example: '2층',
    nullable: true,
  })
  addressDetail: string | null;

  @ApiProperty({
    description: '우편번호',
    example: '03925',
    nullable: true,
  })
  postalCode: string | null;

  @ApiProperty({
    description: '대표자명',
    example: '김영희',
  })
  representativeName: string;

  @ApiProperty({
    description: '연락처',
    example: '02-9876-5432',
  })
  phoneNumber: string;

  @ApiProperty({
    description: '정원',
    example: 30,
  })
  capacity: number;

  @ApiProperty({
    description: '설립일',
    example: '2018-03-15',
  })
  establishedDate: string;

  @ApiProperty({
    description: '기관 소개',
    example: '지역 아동들의 방과후 돌봄을 제공합니다',
    nullable: true,
  })
  introduction: string | null;

  @ApiProperty({
    description: '운영 시간',
    example: '평일 14:00-19:00',
    nullable: true,
  })
  operatingHours: string | null;

  @ApiProperty({
    description: '활성화 여부',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: '소속 선생님 수',
    example: 3,
  })
  teacherCount: number;

  @ApiProperty({
    description: '생성일',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

/**
 * 지역아동센터 목록 응답 DTO (페이지네이션)
 */
export class CommunityChildCenterListResponseDto {
  @ApiProperty({
    description: '지역아동센터 목록',
    type: [CommunityChildCenterResponseDto],
  })
  centers: CommunityChildCenterResponseDto[];

  @ApiProperty({
    description: '전체 개수',
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지당 개수',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: '총 페이지 수',
    example: 5,
  })
  totalPages: number;
}
