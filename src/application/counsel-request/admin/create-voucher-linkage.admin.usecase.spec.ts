import { NotFoundException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { VoucherLinkageRepository, VOUCHER_LINKAGE_REPOSITORY } from '@domain/voucher-linkage/repository/voucher-linkage.repository';
import { VoucherLinkage, VoucherLinkageStatus } from '@domain/voucher-linkage/model/voucher-linkage';
import { CreateVoucherLinkageAdminUseCase } from './create-voucher-linkage.admin.usecase';
import { CreateVoucherLinkageDto } from './dto/voucher-linkage.dto';

describe('CreateVoucherLinkageAdminUseCase', () => {
  let useCase: CreateVoucherLinkageAdminUseCase;
  let mockCounselRequestRepository: jest.Mocked<Repository<CounselRequestEntity>>;
  let mockVoucherLinkageRepository: jest.Mocked<VoucherLinkageRepository>;

  beforeEach(async () => {
    mockCounselRequestRepository = {
      findOne: jest.fn(),
    } as any;

    mockVoucherLinkageRepository = {
      findByCounselRequestId: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      findByStatus: jest.fn(),
      findByCounselRequestIds: jest.fn(),
      deleteByCounselRequestId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateVoucherLinkageAdminUseCase,
        {
          provide: getRepositoryToken(CounselRequestEntity),
          useValue: mockCounselRequestRepository,
        },
        {
          provide: VOUCHER_LINKAGE_REPOSITORY,
          useValue: mockVoucherLinkageRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateVoucherLinkageAdminUseCase>(CreateVoucherLinkageAdminUseCase);
  });

  const createMockCounselRequest = (id: string, isVoucherEligible: boolean) => ({
    id,
    isVoucherEligible,
    childId: 'child-123',
  });

  const createMockVoucherLinkage = (id: string, counselRequestId: string) => {
    return VoucherLinkage.restore({
      id,
      counselRequestId,
      status: VoucherLinkageStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  describe('바우처 연계 생성', () => {
    it('바우처 추천대상 상담의뢰에 연계 정보를 생성한다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const dto: CreateVoucherLinkageDto = { notes: '테스트 메모' };
      const adminId = 'admin-123';

      mockCounselRequestRepository.findOne.mockResolvedValue(
        createMockCounselRequest(counselRequestId, true) as any,
      );
      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(null);
      mockVoucherLinkageRepository.save.mockImplementation((linkage) => Promise.resolve(linkage));

      // When
      const result = await useCase.execute(counselRequestId, dto, adminId);

      // Then
      expect(result.status).toBe(VoucherLinkageStatus.PENDING);
      expect(result.notes).toBe('테스트 메모');
      expect(mockVoucherLinkageRepository.save).toHaveBeenCalled();
    });

    it('존재하지 않는 상담의뢰에 연계 정보 생성 시 NotFoundException을 던진다', async () => {
      // Given
      const counselRequestId = 'non-existent-id';
      const dto: CreateVoucherLinkageDto = {};

      mockCounselRequestRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute(counselRequestId, dto)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(counselRequestId, dto)).rejects.toThrow(
        `상담의뢰를 찾을 수 없습니다: ${counselRequestId}`,
      );
    });

    it('바우처 추천대상이 아닌 상담의뢰에 연계 정보 생성 시 ConflictException을 던진다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const dto: CreateVoucherLinkageDto = {};

      mockCounselRequestRepository.findOne.mockResolvedValue(
        createMockCounselRequest(counselRequestId, false) as any,
      );

      // When & Then
      await expect(useCase.execute(counselRequestId, dto)).rejects.toThrow(ConflictException);
      await expect(useCase.execute(counselRequestId, dto)).rejects.toThrow(
        '바우처 추천대상이 아닌 상담의뢰입니다',
      );
    });

    it('이미 연계 정보가 존재하면 ConflictException을 던진다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const dto: CreateVoucherLinkageDto = {};

      mockCounselRequestRepository.findOne.mockResolvedValue(
        createMockCounselRequest(counselRequestId, true) as any,
      );
      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(
        createMockVoucherLinkage('linkage-123', counselRequestId),
      );

      // When & Then
      await expect(useCase.execute(counselRequestId, dto)).rejects.toThrow(ConflictException);
      await expect(useCase.execute(counselRequestId, dto)).rejects.toThrow(
        '이미 바우처 연계 정보가 존재합니다',
      );
    });

    it('메모 없이도 연계 정보를 생성할 수 있다', async () => {
      // Given
      const counselRequestId = 'counsel-request-456';
      const dto: CreateVoucherLinkageDto = {};

      mockCounselRequestRepository.findOne.mockResolvedValue(
        createMockCounselRequest(counselRequestId, true) as any,
      );
      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(null);
      mockVoucherLinkageRepository.save.mockImplementation((linkage) => Promise.resolve(linkage));

      // When
      const result = await useCase.execute(counselRequestId, dto);

      // Then
      expect(result.status).toBe(VoucherLinkageStatus.PENDING);
      expect(result.notes).toBeUndefined();
    });
  });
});
