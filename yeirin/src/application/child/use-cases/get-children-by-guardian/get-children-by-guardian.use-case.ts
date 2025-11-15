import { Injectable, Inject } from '@nestjs/common';
import { IChildRepository } from '@domain/child/repository/child.repository';
import { ChildResponseDto } from '../../dto/child-response.dto';

/**
 * 보호자 ID로 아동 목록 조회 Use Case
 */
@Injectable()
export class GetChildrenByGuardianUseCase {
  constructor(
    @Inject('IChildRepository')
    private readonly childRepository: IChildRepository,
  ) {}

  async execute(guardianId: string): Promise<ChildResponseDto[]> {
    const children = await this.childRepository.findByGuardianId(guardianId);
    return children.map((child) => ChildResponseDto.fromDomain(child));
  }
}
