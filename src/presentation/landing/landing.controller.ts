import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@infrastructure/auth/decorators/public.decorator';
import { PartnerListResponseDto, PartnerQueryDto } from './dto/partner.dto';
import { LandingService } from './landing.service';

@ApiTags('Landing')
@Controller('api/v1/landing')
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  @Public()
  @Get('partners')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '파트너 기관 목록 조회',
    description:
      '랜딩 페이지용 파트너 기관 목록을 조회합니다. 인증이 필요하지 않습니다.',
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: PartnerListResponseDto,
  })
  async getPartners(
    @Query() query: PartnerQueryDto,
  ): Promise<PartnerListResponseDto> {
    return await this.landingService.getPartners(query);
  }

  @Public()
  @Get('partners/districts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '구/군 목록 조회',
    description: '파트너 기관이 있는 구/군 목록을 조회합니다. 인증이 필요하지 않습니다.',
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: [String],
  })
  async getDistricts(): Promise<string[]> {
    return await this.landingService.getDistricts();
  }
}
