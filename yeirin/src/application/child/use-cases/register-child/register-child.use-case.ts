import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Child } from '@domain/child/model/child';
import { BirthDate } from '@domain/child/model/value-objects/birth-date.vo';
import { ChildName } from '@domain/child/model/value-objects/child-name.vo';
import { Gender } from '@domain/child/model/value-objects/gender.vo';
import { ChildRepository } from '@domain/child/repository/child.repository';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import { ChildResponseDto } from '../../dto/child-response.dto';
import { RegisterChildDto } from '../../dto/register-child.dto';

/**
 * 아동 등록 Use Case
 * - 보호자 또는 양육시설이 아동을 등록
 * - 비즈니스 규칙 검증 포함
 */
@Injectable()
export class RegisterChildUseCase {
  constructor(
    @Inject('ChildRepository')
    private readonly childRepository: ChildRepository,
    @Inject('GuardianProfileRepository')
    private readonly guardianRepository: GuardianProfileRepository,
  ) {}

  async execute(dto: RegisterChildDto): Promise<ChildResponseDto> {
    // 1. 비즈니스 규칙: guardianId와 institutionId 중 하나만 제공되어야 함
    const hasGuardian = !!dto.guardianId;
    const hasInstitution = !!dto.institutionId;

    if (!hasGuardian && !hasInstitution) {
      throw new BadRequestException('보호자 또는 양육시설 ID 중 하나는 필수입니다');
    }

    if (hasGuardian && hasInstitution) {
      throw new BadRequestException('보호자와 양육시설 ID는 동시에 제공할 수 없습니다');
    }

    // 2. 보호자 존재 확인 (guardianId가 있는 경우)
    if (dto.guardianId) {
      const guardianExists = await this.guardianRepository.exists(dto.guardianId);
      if (!guardianExists) {
        throw new NotFoundException(`보호자를 찾을 수 없습니다: ${dto.guardianId}`);
      }
    }

    // 3. Value Objects 생성
    const nameResult = ChildName.create(dto.name);
    if (nameResult.isFailure) {
      throw new BadRequestException(nameResult.getError().message);
    }

    const birthDateResult = BirthDate.create(new Date(dto.birthDate));
    if (birthDateResult.isFailure) {
      throw new BadRequestException(birthDateResult.getError().message);
    }

    const genderResult = Gender.create(dto.gender);
    if (genderResult.isFailure) {
      throw new BadRequestException(genderResult.getError().message);
    }

    // 4. Child Aggregate 생성
    const childResult = Child.create({
      name: nameResult.getValue(),
      birthDate: birthDateResult.getValue(),
      gender: genderResult.getValue(),
      guardianId: dto.guardianId ?? null,
      institutionId: dto.institutionId ?? null,
      medicalInfo: dto.medicalInfo,
      specialNeeds: dto.specialNeeds,
    });

    if (childResult.isFailure) {
      throw new BadRequestException(childResult.getError().message);
    }

    // 5. 저장
    const child = await this.childRepository.save(childResult.getValue());

    // 6. DTO 변환 및 반환
    return ChildResponseDto.fromDomain(child);
  }
}
