import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselorProfileEntity } from '../entity/counselor-profile.entity';
import { CounselorProfileRepository } from '@domain/counselor/repository/counselor-profile.repository';

@Injectable()
export class CounselorProfileRepositoryImpl implements CounselorProfileRepository {
  constructor(
    @InjectRepository(CounselorProfileEntity)
    private readonly counselorRepository: Repository<CounselorProfileEntity>,
  ) {}

  async findById(id: string): Promise<CounselorProfileEntity | null> {
    return await this.counselorRepository.findOne({
      where: { id },
      relations: ['institution'],
    });
  }

  async findAll(page: number, limit: number): Promise<[CounselorProfileEntity[], number]> {
    return await this.counselorRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['institution'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByInstitutionId(institutionId: string): Promise<CounselorProfileEntity[]> {
    return await this.counselorRepository.find({
      where: { institutionId },
      relations: ['institution'],
      order: { experienceYears: 'DESC' },
    });
  }

  async create(
    profile: Omit<CounselorProfileEntity, 'id' | 'createdAt' | 'updatedAt' | 'institution'>,
  ): Promise<CounselorProfileEntity> {
    const newProfile = this.counselorRepository.create(profile);
    return await this.counselorRepository.save(newProfile);
  }

  async update(id: string, profile: Partial<CounselorProfileEntity>): Promise<CounselorProfileEntity> {
    await this.counselorRepository.update(id, profile);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('상담사 프로필을 찾을 수 없습니다');
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.counselorRepository.delete(id);
  }

  async findBySpecialty(specialty: string): Promise<CounselorProfileEntity[]> {
    return await this.counselorRepository
      .createQueryBuilder('counselor')
      .where(':specialty = ANY(counselor.specialties)', { specialty })
      .leftJoinAndSelect('counselor.institution', 'institution')
      .getMany();
  }

  async findByMinExperience(years: number): Promise<CounselorProfileEntity[]> {
    return await this.counselorRepository.find({
      where: { experienceYears: years },
      relations: ['institution'],
      order: { experienceYears: 'DESC' },
    });
  }
}
