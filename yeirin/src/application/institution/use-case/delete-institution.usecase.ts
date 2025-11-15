import { Injectable, NotFoundException } from '@nestjs/common';
import { InstitutionRepository } from '@domain/institution/repository/institution.repository';

/**
 * 바우처 기관 삭제 유스케이스
 */
@Injectable()
export class DeleteInstitutionUseCase {
  constructor(private readonly institutionRepository: InstitutionRepository) {}

  async execute(id: string): Promise<void> {
    // 기관 존재 확인
    const existing = await this.institutionRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`기관을 찾을 수 없습니다 (ID: ${id})`);
    }

    await this.institutionRepository.delete(id);
  }
}
