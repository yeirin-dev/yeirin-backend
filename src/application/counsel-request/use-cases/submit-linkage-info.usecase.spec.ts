import { NotFoundException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import {
  VoucherLinkageRepository,
  VOUCHER_LINKAGE_REPOSITORY,
} from '@domain/voucher-linkage/repository/voucher-linkage.repository';
import { VoucherLinkage, VoucherLinkageStatus } from '@domain/voucher-linkage/model/voucher-linkage';
import { SubmitLinkageInfoUseCase, SubmitLinkageInfoDto } from './submit-linkage-info.usecase';

describe('SubmitLinkageInfoUseCase', () => {
  let useCase: SubmitLinkageInfoUseCase;
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
      findByLinkedVoucherInstitutionId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmitLinkageInfoUseCase,
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

    useCase = module.get<SubmitLinkageInfoUseCase>(SubmitLinkageInfoUseCase);
  });

  const createMockCounselRequest = (id: string, isVoucherEligible: boolean) => ({
    id,
    isVoucherEligible,
    childId: 'child-123',
  });

  const createMockVoucherLinkage = (id: string, counselRequestId: string, submitted = false) => {
    return VoucherLinkage.restore({
      id,
      counselRequestId,
      status: VoucherLinkageStatus.PENDING,
      linkageInfoSubmitted: submitted,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  describe('execute (연계 정보 제출)', () => {
    it('새로운 연계 정보를 생성하고 Guardian 정보를 제출한다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const dto: SubmitLinkageInfoDto = {
        isVoucherConfirmed: true,
        voucherType: '심리치유',
        wantsPlatformLinkage: true,
      };

      mockCounselRequestRepository.findOne.mockResolvedValue(
        createMockCounselRequest(counselRequestId, true) as any,
      );
      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(null);
      mockVoucherLinkageRepository.save.mockImplementation((linkage) => Promise.resolve(linkage));

      // When
      const result = await useCase.execute(counselRequestId, dto);

      // Then
      expect(result.counselRequestId).toBe(counselRequestId);
      expect(result.isVoucherConfirmed).toBe(true);
      expect(result.voucherType).toBe('심리치유');
      expect(result.wantsPlatformLinkage).toBe(true);
      expect(result.linkageInfoSubmitted).toBe(true);
      expect(mockVoucherLinkageRepository.save).toHaveBeenCalledTimes(1);
    });

    it('기존 연계 정보가 있으면 업데이트한다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const dto: SubmitLinkageInfoDto = {
        isVoucherConfirmed: true,
        voucherType: '정서발달',
        wantsPlatformLinkage: false,
        linkageDeclineReason: '다른 기관 이용 중',
      };

      const existingLinkage = createMockVoucherLinkage('linkage-123', counselRequestId);

      mockCounselRequestRepository.findOne.mockResolvedValue(
        createMockCounselRequest(counselRequestId, true) as any,
      );
      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(existingLinkage);
      mockVoucherLinkageRepository.save.mockImplementation((linkage) => Promise.resolve(linkage));

      // When
      const result = await useCase.execute(counselRequestId, dto);

      // Then
      expect(result.id).toBe('linkage-123');
      expect(result.isVoucherConfirmed).toBe(true);
      expect(result.voucherType).toBe('정서발달');
      expect(result.wantsPlatformLinkage).toBe(false);
      expect(result.linkageDeclineReason).toBe('다른 기관 이용 중');
      expect(result.linkageInfoSubmitted).toBe(true);
      expect(mockVoucherLinkageRepository.save).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 상담의뢰에 제출 시 NotFoundException을 던진다', async () => {
      // Given
      const counselRequestId = 'non-existent-id';
      const dto: SubmitLinkageInfoDto = {
        isVoucherConfirmed: true,
        wantsPlatformLinkage: true,
      };

      mockCounselRequestRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute(counselRequestId, dto)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(counselRequestId, dto)).rejects.toThrow(
        `상담의뢰를 찾을 수 없습니다: ${counselRequestId}`,
      );
    });

    it('바우처 추천대상이 아닌 상담의뢰에 제출 시 ConflictException을 던진다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const dto: SubmitLinkageInfoDto = {
        isVoucherConfirmed: true,
        wantsPlatformLinkage: true,
      };

      mockCounselRequestRepository.findOne.mockResolvedValue(
        createMockCounselRequest(counselRequestId, false) as any,
      );

      // When & Then
      await expect(useCase.execute(counselRequestId, dto)).rejects.toThrow(ConflictException);
      await expect(useCase.execute(counselRequestId, dto)).rejects.toThrow(
        '바우처 추천대상이 아닌 상담의뢰입니다',
      );
    });

    it('바우처 미선정 정보를 제출한다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const dto: SubmitLinkageInfoDto = {
        isVoucherConfirmed: false,
        wantsPlatformLinkage: false,
        linkageDeclineReason: '바우처 미선정됨',
      };

      mockCounselRequestRepository.findOne.mockResolvedValue(
        createMockCounselRequest(counselRequestId, true) as any,
      );
      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(null);
      mockVoucherLinkageRepository.save.mockImplementation((linkage) => Promise.resolve(linkage));

      // When
      const result = await useCase.execute(counselRequestId, dto);

      // Then
      expect(result.isVoucherConfirmed).toBe(false);
      expect(result.voucherType).toBeUndefined();
      expect(result.wantsPlatformLinkage).toBe(false);
      expect(result.linkageDeclineReason).toBe('바우처 미선정됨');
      expect(result.linkageInfoSubmitted).toBe(true);
    });

    it('이미 제출된 연계 정보를 수정하여 다시 제출한다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const dto: SubmitLinkageInfoDto = {
        isVoucherConfirmed: true,
        voucherType: '심리치유',
        wantsPlatformLinkage: true,
      };

      const existingLinkage = createMockVoucherLinkage('linkage-123', counselRequestId, true);
      // 기존에 미선정으로 제출된 상태를 시뮬레이션
      existingLinkage.submitLinkageInfo({
        isVoucherConfirmed: false,
        wantsPlatformLinkage: false,
        linkageDeclineReason: '이전 사유',
      });

      mockCounselRequestRepository.findOne.mockResolvedValue(
        createMockCounselRequest(counselRequestId, true) as any,
      );
      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(existingLinkage);
      mockVoucherLinkageRepository.save.mockImplementation((linkage) => Promise.resolve(linkage));

      // When
      const result = await useCase.execute(counselRequestId, dto);

      // Then
      expect(result.isVoucherConfirmed).toBe(true);
      expect(result.voucherType).toBe('심리치유');
      expect(result.wantsPlatformLinkage).toBe(true);
      expect(result.linkageDeclineReason).toBeUndefined();
    });
  });

  describe('getLinkageInfo (연계 정보 조회)', () => {
    it('존재하는 연계 정보를 조회한다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const linkage = createMockVoucherLinkage('linkage-123', counselRequestId, true);
      linkage.submitLinkageInfo({
        isVoucherConfirmed: true,
        voucherType: '심리치유',
        wantsPlatformLinkage: true,
      });

      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(linkage);

      // When
      const result = await useCase.getLinkageInfo(counselRequestId);

      // Then
      expect(result).not.toBeNull();
      expect(result!.counselRequestId).toBe(counselRequestId);
      expect(result!.isVoucherConfirmed).toBe(true);
      expect(result!.voucherType).toBe('심리치유');
      expect(result!.linkageInfoSubmitted).toBe(true);
    });

    it('연계 정보가 없으면 null을 반환한다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(null);

      // When
      const result = await useCase.getLinkageInfo(counselRequestId);

      // Then
      expect(result).toBeNull();
    });
  });
});
