import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@infrastructure/auth/decorators/public.decorator';
import { PartnerListResponseDto, PartnerQueryDto } from './dto/partner.dto';
import {
  CreateFastTrackCounselingReferralDto,
  FastTrackReferralResponseDto,
} from './dto/create-fast-track-referral.dto';
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
    description: '랜딩 페이지용 파트너 기관 목록을 조회합니다. 인증이 필요하지 않습니다.',
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: PartnerListResponseDto,
  })
  async getPartners(@Query() query: PartnerQueryDto): Promise<PartnerListResponseDto> {
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

  @Public()
  @Post('fast-track-referral')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '긴급 상담의뢰서 접수',
    description:
      '긴급하게 연계를 희망하는 아동에 대한 상담의뢰서를 접수합니다. 인증이 필요하지 않습니다.',
  })
  @ApiResponse({
    status: 201,
    description: '접수 성공',
    type: FastTrackReferralResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '유효성 검증 실패',
  })
  async createFastTrackReferral(
    @Body() dto: CreateFastTrackCounselingReferralDto,
  ): Promise<FastTrackReferralResponseDto> {
    return await this.landingService.createFastTrackReferral(dto);
  }
}
