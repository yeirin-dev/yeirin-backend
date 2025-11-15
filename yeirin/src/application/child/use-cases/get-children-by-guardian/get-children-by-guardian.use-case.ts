import { Inject, Injectable } from '@nestjs/common';
import { ChildRepository } from '@domain/child/repository/child.repository';
import { ChildResponseDto } from '../../dto/child-response.dto';

/**
 * 보호자 ID로 아동 목록 조회 Use Case
 */
@Injectable()
export class GetChildrenByGuardianUseCase {
  constructor(
    @Inject('ChildRepository')
    private readonly childRepository: ChildRepository,
  ) {}

  async execute(guardianId: string): Promise<ChildResponseDto[]> {
    const children = await this.childRepository.findByGuardianId(guardianId);
    return children.map((child) => ChildResponseDto.fromDomain(child));
  }
}
