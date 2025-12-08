import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Child } from '@domain/child/model/child';
import { ChildRepository } from '@domain/child/repository/child.repository';
import { ChildType, ChildTypeValue } from '@domain/child/model/value-objects/child-type.vo';
import { ChildName } from '@domain/child/model/value-objects/child-name.vo';
import { BirthDate } from '@domain/child/model/value-objects/birth-date.vo';
import { Gender, GenderType } from '@domain/child/model/value-objects/gender.vo';
import {
  PsychologicalStatus,
  PsychologicalStatusValue,
} from '@domain/child/model/value-objects/psychological-status.vo';
import { PsychologicalStatus as PsychologicalStatusEnum } from '@infrastructure/persistence/typeorm/entity/enums/psychological-status.enum';
import { PsychologicalStatusLogEntity } from '@infrastructure/persistence/typeorm/entity/psychological-status-log.entity';
import { UpdatePsychologicalStatusUseCase } from './update-psychological-status.use-case';
import { UpdatePsychologicalStatusDto } from '../../dto/update-psychological-status.dto';

describe('UpdatePsychologicalStatusUseCase', () => {
  let useCase: UpdatePsychologicalStatusUseCase;
  let mockChildRepository: jest.Mocked<ChildRepository>;
  let mockLogRepository: jest.Mocked<Repository<PsychologicalStatusLogEntity>>;

  beforeEach(async () => {
    mockChildRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByGuardianId: jest.fn(),
      findByCareFacilityId: jest.fn(),
      findByCommunityChildCenterId: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      countByGuardianId: jest.fn(),
      countByCareFacilityId: jest.fn(),
      countByCommunityChildCenterId: jest.fn(),
    };

    mockLogRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePsychologicalStatusUseCase,
        {
          provide: 'ChildRepository',
          useValue: mockChildRepository,
        },
        {
          provide: getRepositoryToken(PsychologicalStatusLogEntity),
          useValue: mockLogRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdatePsychologicalStatusUseCase>(UpdatePsychologicalStatusUseCase);
  });

  const createMockChild = (
    id: string,
    psychologicalStatusValue: PsychologicalStatusValue = PsychologicalStatusValue.NORMAL,
  ): Child => {
    return Child.restore(
      {
        childType: ChildType.create(ChildTypeValue.REGULAR).getValue(),
        name: ChildName.create('홍길동').getValue(),
        birthDate: BirthDate.create(new Date('2015-05-10')).getValue(),
        gender: Gender.create(GenderType.MALE).getValue(),
        guardianId: 'guardian-123',
        careFacilityId: null,
        communityChildCenterId: null,
        psychologicalStatus: PsychologicalStatus.create(psychologicalStatusValue).getValue(),
      },
      id,
      new Date(),
    );
  };

  describe('심리 상태 업데이트', () => {
    it('NORMAL에서 AT_RISK로 상태를 업데이트한다 (위험도 상승)', async () => {
      // Given
      const childId = 'child-123';
      const mockChild = createMockChild(childId, PsychologicalStatusValue.NORMAL);
      const dto: UpdatePsychologicalStatusDto = {
        childId,
        newStatus: PsychologicalStatusEnum.AT_RISK,
        reason: '대화 중 자해 관련 키워드 감지',
        sessionId: 'session-123',
      };

      const savedLog = {
        id: 'log-123',
        childId,
        previousStatus: PsychologicalStatusEnum.NORMAL,
        newStatus: PsychologicalStatusEnum.AT_RISK,
        isEscalation: true,
        createdAt: new Date(),
      };

      mockChildRepository.findById.mockResolvedValue(mockChild);
      mockChildRepository.save.mockResolvedValue(mockChild);
      mockLogRepository.create.mockReturnValue(savedLog as any);
      mockLogRepository.save.mockResolvedValue(savedLog as any);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.childId).toBe(childId);
      expect(result.previousStatus).toBe(PsychologicalStatusEnum.NORMAL);
      expect(result.newStatus).toBe(PsychologicalStatusEnum.AT_RISK);
      expect(result.isEscalation).toBe(true);
      expect(result.logId).toBe('log-123');
      expect(mockChildRepository.save).toHaveBeenCalled();
      expect(mockLogRepository.save).toHaveBeenCalled();
    });

    it('AT_RISK에서 HIGH_RISK로 상태를 업데이트한다 (위험도 상승)', async () => {
      // Given
      const childId = 'child-456';
      const mockChild = createMockChild(childId, PsychologicalStatusValue.AT_RISK);
      const dto: UpdatePsychologicalStatusDto = {
        childId,
        newStatus: PsychologicalStatusEnum.HIGH_RISK,
        reason: '자살 충동 언급 감지',
      };

      const savedLog = {
        id: 'log-456',
        childId,
        previousStatus: PsychologicalStatusEnum.AT_RISK,
        newStatus: PsychologicalStatusEnum.HIGH_RISK,
        isEscalation: true,
        createdAt: new Date(),
      };

      mockChildRepository.findById.mockResolvedValue(mockChild);
      mockChildRepository.save.mockResolvedValue(mockChild);
      mockLogRepository.create.mockReturnValue(savedLog as any);
      mockLogRepository.save.mockResolvedValue(savedLog as any);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.isEscalation).toBe(true);
      expect(result.newStatus).toBe(PsychologicalStatusEnum.HIGH_RISK);
    });

    it('HIGH_RISK에서 AT_RISK로 상태를 업데이트한다 (위험도 하강)', async () => {
      // Given
      const childId = 'child-789';
      const mockChild = createMockChild(childId, PsychologicalStatusValue.HIGH_RISK);
      const dto: UpdatePsychologicalStatusDto = {
        childId,
        newStatus: PsychologicalStatusEnum.AT_RISK,
        reason: '상담 후 상태 호전',
      };

      const savedLog = {
        id: 'log-789',
        childId,
        previousStatus: PsychologicalStatusEnum.HIGH_RISK,
        newStatus: PsychologicalStatusEnum.AT_RISK,
        isEscalation: false,
        createdAt: new Date(),
      };

      mockChildRepository.findById.mockResolvedValue(mockChild);
      mockChildRepository.save.mockResolvedValue(mockChild);
      mockLogRepository.create.mockReturnValue(savedLog as any);
      mockLogRepository.save.mockResolvedValue(savedLog as any);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.isEscalation).toBe(false);
      expect(result.previousStatus).toBe(PsychologicalStatusEnum.HIGH_RISK);
      expect(result.newStatus).toBe(PsychologicalStatusEnum.AT_RISK);
    });

    it('동일한 상태로 업데이트 시 로그를 생성하지 않는다', async () => {
      // Given
      const childId = 'child-same';
      const mockChild = createMockChild(childId, PsychologicalStatusValue.NORMAL);
      const dto: UpdatePsychologicalStatusDto = {
        childId,
        newStatus: PsychologicalStatusEnum.NORMAL,
        reason: '상태 확인',
      };

      mockChildRepository.findById.mockResolvedValue(mockChild);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.isEscalation).toBe(false);
      expect(result.logId).toBe('');
      expect(mockChildRepository.save).not.toHaveBeenCalled();
      expect(mockLogRepository.save).not.toHaveBeenCalled();
    });

    it('존재하지 않는 아동 ID로 요청시 NotFoundException을 던진다', async () => {
      // Given
      const dto: UpdatePsychologicalStatusDto = {
        childId: 'non-existent-child',
        newStatus: PsychologicalStatusEnum.AT_RISK,
        reason: '테스트',
      };

      mockChildRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
    });

    it('메타데이터가 포함된 요청을 처리한다', async () => {
      // Given
      const childId = 'child-with-metadata';
      const mockChild = createMockChild(childId, PsychologicalStatusValue.NORMAL);
      const dto: UpdatePsychologicalStatusDto = {
        childId,
        newStatus: PsychologicalStatusEnum.AT_RISK,
        reason: '키워드 감지',
        sessionId: 'session-456',
        metadata: {
          detectedKeywords: ['힘들어', '살고 싶지 않아'],
          conversationContext: '학교 왕따 관련 상담 중',
          confidenceScore: 0.85,
        },
      };

      const savedLog = {
        id: 'log-metadata',
        childId,
        previousStatus: PsychologicalStatusEnum.NORMAL,
        newStatus: PsychologicalStatusEnum.AT_RISK,
        isEscalation: true,
        metadata: dto.metadata,
        createdAt: new Date(),
      };

      mockChildRepository.findById.mockResolvedValue(mockChild);
      mockChildRepository.save.mockResolvedValue(mockChild);
      mockLogRepository.create.mockReturnValue(savedLog as any);
      mockLogRepository.save.mockResolvedValue(savedLog as any);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.logId).toBe('log-metadata');
      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: dto.metadata,
        }),
      );
    });
  });

  describe('응답 DTO 변환', () => {
    it('응답에 필수 필드가 포함된다', async () => {
      // Given
      const childId = 'child-response';
      const mockChild = createMockChild(childId, PsychologicalStatusValue.NORMAL);
      const dto: UpdatePsychologicalStatusDto = {
        childId,
        newStatus: PsychologicalStatusEnum.AT_RISK,
        reason: '테스트',
      };

      const savedLog = {
        id: 'log-response',
        childId,
        previousStatus: PsychologicalStatusEnum.NORMAL,
        newStatus: PsychologicalStatusEnum.AT_RISK,
        isEscalation: true,
        createdAt: new Date(),
      };

      mockChildRepository.findById.mockResolvedValue(mockChild);
      mockChildRepository.save.mockResolvedValue(mockChild);
      mockLogRepository.create.mockReturnValue(savedLog as any);
      mockLogRepository.save.mockResolvedValue(savedLog as any);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result).toHaveProperty('childId');
      expect(result).toHaveProperty('previousStatus');
      expect(result).toHaveProperty('newStatus');
      expect(result).toHaveProperty('isEscalation');
      expect(result).toHaveProperty('logId');
      expect(result).toHaveProperty('processedAt');
    });
  });
});
