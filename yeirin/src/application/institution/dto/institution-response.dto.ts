import { ApiProperty } from '@nestjs/swagger';

/**
 * 바우처 기관 응답 DTO
 */
export class InstitutionResponseDto {
  @ApiProperty({
    description: '기관 ID',
    example: '93dfda2d-6cd3-4e86-8259-ee1c098234f7',
  })
  id: string;

  @ApiProperty({
    description: '센터명',
    example: '서울아동심리상담센터',
  })
  centerName: string;

  @ApiProperty({
    description: '대표자명',
    example: '김철수',
  })
  representativeName: string;

  @ApiProperty({
    description: '센터 주소',
    example: '서울특별시 강남구 테헤란로 123',
  })
  address: string;

  @ApiProperty({
    description: '개소일',
    example: '2020-01-15',
  })
  establishedDate: string;

  @ApiProperty({
    description: '운영 중인 바우처 목록',
    example: ['CHILD_VOUCHER', 'YOUTH_VOUCHER'],
  })
  operatingVouchers: string[];

  @ApiProperty({
    description: '제공 서비스 목록',
    example: ['INDIVIDUAL_COUNSELING', 'GROUP_COUNSELING'],
  })
  providedServices: string[];

  @ApiProperty({
    description: '특수 치료 항목',
    example: ['PLAY_THERAPY', 'ART_THERAPY'],
  })
  specialTreatments: string[];

  @ApiProperty({
    description: '품질 인증 여부',
    example: true,
  })
  isQualityCertified: boolean;

  @ApiProperty({
    description: '평균 평점',
    example: 4.5,
  })
  averageRating: number;

  @ApiProperty({
    description: '상담사 수',
    example: 5,
  })
  counselorCount: number;

  @ApiProperty({
    description: '리뷰 수',
    example: 12,
  })
  reviewCount: number;

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
 * 기관 목록 응답 DTO (페이지네이션)
 */
export class InstitutionListResponseDto {
  @ApiProperty({
    description: '기관 목록',
    type: [InstitutionResponseDto],
  })
  institutions: InstitutionResponseDto[];

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
