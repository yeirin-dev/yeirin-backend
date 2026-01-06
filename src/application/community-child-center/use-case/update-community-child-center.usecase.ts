import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Address } from '@domain/common/value-objects/address.vo';
import { InstitutionName } from '@domain/common/value-objects/institution-name.vo';
import { CommunityChildCenterRepository } from '@domain/community-child-center/repository/community-child-center.repository';
import { CommunityChildCenterResponseDto } from '../dto/community-child-center-response.dto';
import { UpdateCommunityChildCenterDto } from '../dto/update-community-child-center.dto';

/**
 * 지역아동센터 수정 유스케이스
 *
 * NOTE: Institution-based login으로 전환됨 - 개별 교사 계정 없음
 */
@Injectable()
export class UpdateCommunityChildCenterUseCase {
  constructor(
    @Inject('CommunityChildCenterRepository')
    private readonly communityChildCenterRepository: CommunityChildCenterRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateCommunityChildCenterDto,
  ): Promise<CommunityChildCenterResponseDto> {
    const center = await this.communityChildCenterRepository.findById(id);

    if (!center) {
      throw new NotFoundException(`지역아동센터를 찾을 수 없습니다 (ID: ${id})`);
    }

    // 기관명 변경
    if (dto.name !== undefined) {
      // 중복 확인 (자기 자신 제외)
      const existingCenter = await this.communityChildCenterRepository.findByName(dto.name);
      if (existingCenter && existingCenter.id !== id) {
        throw new BadRequestException(`이미 존재하는 기관명입니다: ${dto.name}`);
      }

      const nameResult = InstitutionName.create(dto.name);
      if (nameResult.isFailure) {
        throw new BadRequestException(nameResult.getError().message);
      }
      center.changeName(nameResult.getValue());
    }

    // 주소 변경
    if (
      dto.address !== undefined ||
      dto.addressDetail !== undefined ||
      dto.postalCode !== undefined
    ) {
      const addressResult = Address.create({
        address: dto.address ?? center.address.address,
        addressDetail: dto.addressDetail ?? center.address.addressDetail ?? undefined,
        postalCode: dto.postalCode ?? center.address.postalCode ?? undefined,
      });
      if (addressResult.isFailure) {
        throw new BadRequestException(addressResult.getError().message);
      }
      center.changeAddress(addressResult.getValue());
    }

    // 센터장 정보 변경
    if (dto.directorName !== undefined || dto.phoneNumber !== undefined) {
      const result = center.changeDirector(
        dto.directorName ?? center.directorName,
        dto.phoneNumber ?? center.phoneNumber ?? undefined,
      );
      if (result.isFailure) {
        throw new BadRequestException(result.getError().message);
      }
    }

    // 정원 변경
    if (dto.capacity !== undefined) {
      const result = center.changeCapacity(dto.capacity);
      if (result.isFailure) {
        throw new BadRequestException(result.getError().message);
      }
    }

    // 소개 변경
    if (dto.introduction !== undefined) {
      const result = center.changeIntroduction(dto.introduction);
      if (result.isFailure) {
        throw new BadRequestException(result.getError().message);
      }
    }

    // 운영 시간 변경
    if (dto.operatingHours !== undefined) {
      const result = center.changeOperatingHours(dto.operatingHours);
      if (result.isFailure) {
        throw new BadRequestException(result.getError().message);
      }
    }

    // 활성화 상태 변경
    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        center.activate();
      } else {
        center.deactivate();
      }
    }

    // 저장
    const savedCenter = await this.communityChildCenterRepository.save(center);

    // NOTE: Institution-based login으로 전환됨 - 개별 교사 계정 없음
    const teacherCount = 0;

    return {
      id: savedCenter.id,
      name: savedCenter.name.value,
      address: savedCenter.address.address,
      addressDetail: savedCenter.address.addressDetail,
      postalCode: savedCenter.address.postalCode,
      directorName: savedCenter.directorName,
      phoneNumber: savedCenter.phoneNumber,
      capacity: savedCenter.capacity,
      establishedDate: savedCenter.establishedDate?.toISOString().split('T')[0] ?? null,
      introduction: savedCenter.introduction,
      operatingHours: savedCenter.operatingHours,
      isActive: savedCenter.isActive,
      teacherCount,
      createdAt: savedCenter.createdAt,
      updatedAt: savedCenter.updatedAt,
    };
  }
}
