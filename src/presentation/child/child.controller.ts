import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChildRepository } from '@domain/child/repository/child.repository';
import { ChildResponseDto } from '@application/child/dto/child-response.dto';
import { RegisterChildDto } from '@application/child/dto/register-child.dto';
import { UpdateChildDto } from '@application/child/dto/update-child.dto';
import {
  SendGuardianSmsDto,
  SendGuardianSmsResponseDto,
} from '@application/child/dto/send-guardian-sms.dto';
import { BirthDate } from '@domain/child/model/value-objects/birth-date.vo';
import { ChildName } from '@domain/child/model/value-objects/child-name.vo';
import { Gender } from '@domain/child/model/value-objects/gender.vo';
import { RegisterChildUseCase } from '@application/child/use-cases/register-child/register-child.use-case';
import {
  CurrentUser,
  CurrentUserData,
} from '@infrastructure/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { ChildType } from '@infrastructure/persistence/typeorm/entity/enums/child-type.enum';
import { SoulEClient } from '@infrastructure/external/soul-e.client';
import { SmsService } from '@infrastructure/external/sms.service';
import { CareFacilityRepository } from '@domain/care-facility/repository/care-facility.repository';
import { CommunityChildCenterRepository } from '@domain/community-child-center/repository/community-child-center.repository';

/**
 * 아동 관리 Controller
 *
 * NOTE: 모든 아동은 시설(Institution)에 직접 연결됩니다.
 * 시설 인증 후 해당 시설의 아동만 조회/관리할 수 있습니다.
 */
@ApiTags('아동 관리')
@Controller('api/v1/children')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChildController {
  private readonly logger = new Logger(ChildController.name);

  constructor(
    private readonly registerChildUseCase: RegisterChildUseCase,
    @Inject('ChildRepository')
    private readonly childRepository: ChildRepository,
    @Inject('CareFacilityRepository')
    private readonly careFacilityRepository: CareFacilityRepository,
    @Inject('CommunityChildCenterRepository')
    private readonly communityChildCenterRepository: CommunityChildCenterRepository,
    private readonly soulEClient: SoulEClient,
    private readonly smsService: SmsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '내 시설의 아동 목록 조회 (로그인한 시설)' })
  @ApiResponse({
    status: 200,
    description: '아동 목록',
    type: [ChildResponseDto],
  })
  async getMyChildren(@CurrentUser() user: CurrentUserData): Promise<ChildResponseDto[]> {
    // 시설 인증인지 확인
    if (user.role !== 'INSTITUTION' || !user.facilityType || !user.institutionId) {
      throw new ForbiddenException('시설 로그인이 필요합니다.');
    }

    // 시설 유형에 따라 조회
    if (user.facilityType === 'CARE_FACILITY') {
      const children = await this.childRepository.findByCareFacilityId(user.institutionId);
      return children.map((child) => ChildResponseDto.fromDomain(child));
    }

    if (user.facilityType === 'COMMUNITY_CENTER') {
      const children = await this.childRepository.findByCommunityChildCenterId(user.institutionId);
      return children.map((child) => ChildResponseDto.fromDomain(child));
    }

    throw new BadRequestException('알 수 없는 시설 유형입니다.');
  }

  @Post()
  @ApiOperation({
    summary: '아동 등록',
    description: `
시설 로그인 후 아동을 등록합니다.
- CARE_FACILITY (양육시설): 양육시설 ID가 자동으로 연결됩니다.
- COMMUNITY_CENTER (지역아동센터): 지역아동센터 ID가 자동으로 연결됩니다.
    `,
  })
  @ApiResponse({
    status: 201,
    description: '아동이 성공적으로 등록되었습니다',
    type: ChildResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '시설 로그인 필요' })
  async registerChild(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RegisterChildDto,
  ): Promise<ChildResponseDto> {
    // 시설 인증인지 확인
    if (user.role !== 'INSTITUTION' || !user.facilityType || !user.institutionId) {
      throw new ForbiddenException('시설 로그인이 필요합니다.');
    }

    // 시설 유형과 요청 아동 유형 일치 여부 확인
    if (user.facilityType === 'CARE_FACILITY') {
      if (dto.childType !== ChildType.CARE_FACILITY) {
        throw new BadRequestException('양육시설에서는 양육시설 아동만 등록할 수 있습니다.');
      }
      // 시설 ID 자동 주입
      return await this.registerChildUseCase.execute({
        ...dto,
        careFacilityId: user.institutionId,
      });
    }

    if (user.facilityType === 'COMMUNITY_CENTER') {
      if (dto.childType !== ChildType.COMMUNITY_CENTER) {
        throw new BadRequestException('지역아동센터에서는 지역아동센터 아동만 등록할 수 있습니다.');
      }
      // 시설 ID 자동 주입
      return await this.registerChildUseCase.execute({
        ...dto,
        communityChildCenterId: user.institutionId,
      });
    }

    throw new BadRequestException('알 수 없는 시설 유형입니다.');
  }

  @Get(':id')
  @ApiOperation({ summary: '아동 상세 조회' })
  @ApiResponse({
    status: 200,
    description: '아동 상세 정보',
    type: ChildResponseDto,
  })
  @ApiResponse({ status: 403, description: '조회 권한 없음' })
  @ApiResponse({ status: 404, description: '아동을 찾을 수 없음' })
  async getChild(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<ChildResponseDto> {
    const child = await this.childRepository.findById(id);
    if (!child) {
      throw new NotFoundException('아동을 찾을 수 없습니다.');
    }

    // 권한 확인: 시설 인증인 경우 해당 시설의 아동인지 확인
    if (user.role === 'INSTITUTION' && user.institutionId) {
      const hasPermission =
        (child.careFacilityId && child.careFacilityId === user.institutionId) ||
        (child.communityChildCenterId && child.communityChildCenterId === user.institutionId);

      if (!hasPermission) {
        throw new ForbiddenException('이 아동을 조회할 권한이 없습니다.');
      }
    }

    return ChildResponseDto.fromDomain(child);
  }

  @Patch(':id')
  @ApiOperation({ summary: '아동 정보 수정' })
  @ApiResponse({
    status: 200,
    description: '아동 정보 수정 성공',
    type: ChildResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '수정 권한 없음' })
  @ApiResponse({ status: 404, description: '아동을 찾을 수 없음' })
  async updateChild(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateChildDto,
  ): Promise<ChildResponseDto> {
    // 아동 존재 확인
    const child = await this.childRepository.findById(id);
    if (!child) {
      throw new NotFoundException('아동을 찾을 수 없습니다.');
    }

    // 시설 인증인지 확인
    if (user.role !== 'INSTITUTION' || !user.institutionId) {
      throw new ForbiddenException('시설 로그인이 필요합니다.');
    }

    // 권한 확인: 해당 시설의 아동인지 확인
    const hasPermission =
      (child.careFacilityId && child.careFacilityId === user.institutionId) ||
      (child.communityChildCenterId && child.communityChildCenterId === user.institutionId);

    if (!hasPermission) {
      throw new ForbiddenException('이 아동을 수정할 권한이 없습니다.');
    }

    // 이름 업데이트
    if (dto.name !== undefined) {
      const nameResult = ChildName.create(dto.name);
      if (nameResult.isFailure) {
        throw new BadRequestException(nameResult.getError().message);
      }
      child.updateName(nameResult.getValue());
    }

    // 생년월일 업데이트
    if (dto.birthDate !== undefined) {
      const birthDateResult = BirthDate.create(new Date(dto.birthDate));
      if (birthDateResult.isFailure) {
        throw new BadRequestException(birthDateResult.getError().message);
      }
      child.updateBirthDate(birthDateResult.getValue());
    }

    // 성별 업데이트
    if (dto.gender !== undefined) {
      const genderResult = Gender.create(dto.gender);
      if (genderResult.isFailure) {
        throw new BadRequestException(genderResult.getError().message);
      }
      child.updateGender(genderResult.getValue());
    }

    // 의료 정보 업데이트
    if (dto.medicalInfo !== undefined) {
      child.updateMedicalInfo(dto.medicalInfo);
    }

    // 특수 요구사항 업데이트
    if (dto.specialNeeds !== undefined) {
      child.updateSpecialNeeds(dto.specialNeeds);
    }

    // 저장
    const updatedChild = await this.childRepository.save(child);

    return ChildResponseDto.fromDomain(updatedChild);
  }

  @Delete(':id')
  @ApiOperation({ summary: '아동 삭제' })
  @ApiResponse({ status: 200, description: '아동 삭제 성공' })
  @ApiResponse({ status: 403, description: '삭제 권한 없음' })
  @ApiResponse({ status: 404, description: '아동을 찾을 수 없음' })
  async deleteChild(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    // 아동 존재 확인
    const child = await this.childRepository.findById(id);
    if (!child) {
      throw new NotFoundException('아동을 찾을 수 없습니다.');
    }

    // 시설 인증인지 확인
    if (user.role !== 'INSTITUTION' || !user.institutionId) {
      throw new ForbiddenException('시설 로그인이 필요합니다.');
    }

    // 권한 확인: 해당 시설의 아동인지 확인
    const hasPermission =
      (child.careFacilityId && child.careFacilityId === user.institutionId) ||
      (child.communityChildCenterId && child.communityChildCenterId === user.institutionId);

    if (!hasPermission) {
      throw new ForbiddenException('이 아동을 삭제할 권한이 없습니다.');
    }

    await this.childRepository.delete(id);

    return { message: '아동이 삭제되었습니다.' };
  }

  @Post(':id/guardian-sms')
  @ApiOperation({
    summary: '보호자 동의 SMS 발송',
    description: `
아동의 보호자에게 동의 요청 SMS를 발송합니다.
SMS에는 보호자 동의 페이지 URL이 포함됩니다.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'SMS 발송 성공',
    type: SendGuardianSmsResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '발송 권한 없음' })
  @ApiResponse({ status: 404, description: '아동을 찾을 수 없음' })
  async sendGuardianSms(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: SendGuardianSmsDto,
  ): Promise<SendGuardianSmsResponseDto> {
    this.logger.log(`보호자 동의 SMS 발송 요청 - childId: ${id}`);

    // 아동 존재 확인
    const child = await this.childRepository.findById(id);
    if (!child) {
      throw new NotFoundException('아동을 찾을 수 없습니다.');
    }

    // 시설 인증인지 확인
    if (user.role !== 'INSTITUTION' || !user.institutionId) {
      throw new ForbiddenException('시설 로그인이 필요합니다.');
    }

    // 권한 확인: 해당 시설의 아동인지 확인
    const hasPermission =
      (child.careFacilityId && child.careFacilityId === user.institutionId) ||
      (child.communityChildCenterId && child.communityChildCenterId === user.institutionId);

    if (!hasPermission) {
      throw new ForbiddenException('이 아동에 대한 SMS 발송 권한이 없습니다.');
    }

    // 시설 이름 조회
    let institutionName = '소울이';
    if (child.careFacilityId) {
      const careFacility = await this.careFacilityRepository.findById(child.careFacilityId);
      if (careFacility) {
        institutionName = careFacility.name.value;
      }
    } else if (child.communityChildCenterId) {
      const communityCenter = await this.communityChildCenterRepository.findById(
        child.communityChildCenterId,
      );
      if (communityCenter) {
        institutionName = communityCenter.name.value;
      }
    }

    try {
      // 1. Soul-E에서 보호자 동의 링크 생성
      const linkResponse = await this.soulEClient.generateGuardianConsentLink({
        child_id: id,
        child_name: child.name.value,
        child_birth_date: child.birthDate.value.toISOString().split('T')[0], // YYYY-MM-DD
        institution_name: institutionName,
        guardian_phone: dto.guardianPhone,
        expiry_days: 7,
      });

      this.logger.log(`보호자 동의 링크 생성 완료 - url: ${linkResponse.consent_url}`);

      // 2. SMS 발송
      const smsResult = await this.smsService.sendGuardianConsentSms(
        dto.guardianPhone,
        linkResponse.consent_url,
        child.name.value,
      );

      if (!smsResult.success) {
        this.logger.error(`SMS 발송 실패 - ${smsResult.errorMessage}`);
        throw new InternalServerErrorException(
          smsResult.errorMessage || 'SMS 발송에 실패했습니다.',
        );
      }

      this.logger.log(`보호자 동의 SMS 발송 완료 - childId: ${id}, to: ${dto.guardianPhone}`);

      // 개발 환경에서는 URL도 반환 (디버깅 용도)
      const isDev = process.env.NODE_ENV !== 'production';

      return {
        success: true,
        message: `${dto.guardianName} 보호자님에게 동의 요청 문자가 발송되었습니다.`,
        ...(isDev && { consentUrl: linkResponse.consent_url }),
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error(`보호자 동의 SMS 발송 중 오류 - ${error}`);
      throw new InternalServerErrorException('보호자 동의 SMS 발송 중 오류가 발생했습니다.');
    }
  }
}
