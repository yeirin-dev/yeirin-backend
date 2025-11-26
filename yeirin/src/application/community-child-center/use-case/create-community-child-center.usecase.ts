import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Address } from '@domain/common/value-objects/address.vo';
import { InstitutionName } from '@domain/common/value-objects/institution-name.vo';
import { CommunityChildCenter } from '@domain/community-child-center/model/community-child-center';
import { CommunityChildCenterRepository } from '@domain/community-child-center/repository/community-child-center.repository';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import { CommunityChildCenterResponseDto } from '../dto/community-child-center-response.dto';
import { CreateCommunityChildCenterDto } from '../dto/create-community-child-center.dto';

/**
 * 지역아동센터 생성 유스케이스
 */
@Injectable()
export class CreateCommunityChildCenterUseCase {
  constructor(
    @Inject('CommunityChildCenterRepository')
    private readonly communityChildCenterRepository: CommunityChildCenterRepository,
    @Inject('GuardianProfileRepository')
    private readonly guardianProfileRepository: GuardianProfileRepository,
  ) {}

  async execute(dto: CreateCommunityChildCenterDto): Promise<CommunityChildCenterResponseDto> {
    // 기관명 중복 확인
    const exists = await this.communityChildCenterRepository.existsByName(dto.name);
    if (exists) {
      throw new BadRequestException(`이미 존재하는 기관명입니다: ${dto.name}`);
    }

    // 기관명 Value Object 생성
    const nameResult = InstitutionName.create(dto.name);
    if (nameResult.isFailure) {
      throw new BadRequestException(nameResult.getError().message);
    }

    // 주소 Value Object 생성
    const addressResult = Address.create({
      address: dto.address,
      addressDetail: dto.addressDetail,
      postalCode: dto.postalCode,
    });
    if (addressResult.isFailure) {
      throw new BadRequestException(addressResult.getError().message);
    }

    // 도메인 모델 생성
    const centerResult = CommunityChildCenter.create({
      name: nameResult.getValue(),
      address: addressResult.getValue(),
      representativeName: dto.representativeName,
      phoneNumber: dto.phoneNumber,
      capacity: dto.capacity,
      establishedDate: new Date(dto.establishedDate),
      introduction: dto.introduction,
      operatingHours: dto.operatingHours,
    });

    if (centerResult.isFailure) {
      throw new BadRequestException(centerResult.getError().message);
    }

    // 저장
    const savedCenter = await this.communityChildCenterRepository.save(centerResult.getValue());

    // 선생님 수 (새로 생성한 센터는 0)
    const teacherCount = await this.guardianProfileRepository.countByCommunityChildCenterId(
      savedCenter.id,
    );

    return {
      id: savedCenter.id,
      name: savedCenter.name.value,
      address: savedCenter.address.address,
      addressDetail: savedCenter.address.addressDetail,
      postalCode: savedCenter.address.postalCode,
      representativeName: savedCenter.representativeName,
      phoneNumber: savedCenter.phoneNumber,
      capacity: savedCenter.capacity,
      establishedDate: savedCenter.establishedDate.toISOString().split('T')[0],
      introduction: savedCenter.introduction,
      operatingHours: savedCenter.operatingHours,
      isActive: savedCenter.isActive,
      teacherCount,
      createdAt: savedCenter.createdAt,
      updatedAt: savedCenter.updatedAt,
    };
  }
}
