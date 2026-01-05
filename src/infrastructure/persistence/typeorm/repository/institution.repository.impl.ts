import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionRepository } from '@domain/institution/repository/institution.repository';
import { VoucherInstitutionEntity } from '../entity/voucher-institution.entity';

@Injectable()
export class InstitutionRepositoryImpl implements InstitutionRepository {
  constructor(
    @InjectRepository(VoucherInstitutionEntity)
    private readonly institutionRepository: Repository<VoucherInstitutionEntity>,
  ) {}

  async findById(id: string): Promise<VoucherInstitutionEntity | null> {
    return await this.institutionRepository.findOne({
      where: { id },
      relations: ['counselorProfiles', 'reviews'],
    });
  }

  async findAll(page: number, limit: number): Promise<[VoucherInstitutionEntity[], number]> {
    return await this.institutionRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['counselorProfiles', 'reviews'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    institution: Omit<
      VoucherInstitutionEntity,
      'id' | 'createdAt' | 'updatedAt' | 'counselorProfiles' | 'reviews'
    >,
  ): Promise<VoucherInstitutionEntity> {
    const newInstitution = this.institutionRepository.create(institution);
    return await this.institutionRepository.save(newInstitution);
  }

  async update(
    id: string,
    institution: Partial<VoucherInstitutionEntity>,
  ): Promise<VoucherInstitutionEntity> {
    await this.institutionRepository.update(id, institution);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('기관을 찾을 수 없습니다');
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.institutionRepository.delete(id);
  }

  async findByVoucherType(voucherType: string): Promise<VoucherInstitutionEntity[]> {
    return await this.institutionRepository
      .createQueryBuilder('institution')
      .where(':voucherType = ANY(institution.operatingVouchers)', { voucherType })
      .leftJoinAndSelect('institution.counselorProfiles', 'counselorProfiles')
      .leftJoinAndSelect('institution.reviews', 'reviews')
      .getMany();
  }

  async findByServiceType(serviceType: string): Promise<VoucherInstitutionEntity[]> {
    return await this.institutionRepository
      .createQueryBuilder('institution')
      .where(':serviceType = ANY(institution.providedServices)', { serviceType })
      .leftJoinAndSelect('institution.counselorProfiles', 'counselorProfiles')
      .leftJoinAndSelect('institution.reviews', 'reviews')
      .getMany();
  }

  async findQualityCertified(): Promise<VoucherInstitutionEntity[]> {
    return await this.institutionRepository.find({
      where: { isQualityCertified: true },
      relations: ['counselorProfiles', 'reviews'],
    });
  }
}
