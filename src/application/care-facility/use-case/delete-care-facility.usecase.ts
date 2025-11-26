import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CareFacilityRepository } from '@domain/care-facility/repository/care-facility.repository';

/**
 * 양육시설 삭제 유스케이스
 */
@Injectable()
export class DeleteCareFacilityUseCase {
  constructor(
    @Inject('CareFacilityRepository')
    private readonly careFacilityRepository: CareFacilityRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const exists = await this.careFacilityRepository.exists(id);

    if (!exists) {
      throw new NotFoundException(`양육시설을 찾을 수 없습니다 (ID: ${id})`);
    }

    await this.careFacilityRepository.delete(id);
  }
}
