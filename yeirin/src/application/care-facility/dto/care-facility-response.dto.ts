import { ApiProperty } from '@nestjs/swagger';

/**
 * 양육시설 응답 DTO
 */
export class CareFacilityResponseDto {
  @ApiProperty({
    description: '기관 ID',
    example: '93dfda2d-6cd3-4e86-8259-ee1c098234f7',
  })
  id: string;

  @ApiProperty({
    description: '기관명',
    example: '사랑양육시설',
  })
  name: string;

  @ApiProperty({
    description: '주소',
    example: '서울특별시 강남구 테헤란로 123',
  })
  address: string;

  @ApiProperty({
    description: '상세주소',
    example: '3층 301호',
    nullable: true,
  })
  addressDetail: string | null;

  @ApiProperty({
    description: '우편번호',
    example: '06234',
    nullable: true,
  })
  postalCode: string | null;

  @ApiProperty({
    description: '대표자명',
    example: '김철수',
  })
  representativeName: string;

  @ApiProperty({
    description: '연락처',
    example: '02-1234-5678',
  })
  phoneNumber: string;

  @ApiProperty({
    description: '정원',
    example: 50,
  })
  capacity: number;

  @ApiProperty({
    description: '설립일',
    example: '2015-03-15',
  })
  establishedDate: string;

  @ApiProperty({
    description: '기관 소개',
    example: '아동복지법에 따른 양육시설로 보호가 필요한 아동을 양육합니다.',
    nullable: true,
  })
  introduction: string | null;

  @ApiProperty({
    description: '활성화 여부',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: '소속 선생님 수',
    example: 5,
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
 * 양육시설 목록 응답 DTO (페이지네이션)
 */
export class CareFacilityListResponseDto {
  @ApiProperty({
    description: '양육시설 목록',
    type: [CareFacilityResponseDto],
  })
  facilities: CareFacilityResponseDto[];

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
