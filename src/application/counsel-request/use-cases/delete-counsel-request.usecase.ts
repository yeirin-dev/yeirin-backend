import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';

@Injectable()
export class DeleteCounselRequestUseCase {
  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const counselRequest = await this.counselRequestRepository.findById(id);

    if (!counselRequest) {
      throw new NotFoundException(`상담의뢰지를 찾을 수 없습니다 (ID: ${id})`);
    }

    await this.counselRequestRepository.delete(id);
  }
}
