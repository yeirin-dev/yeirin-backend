import { NotFoundException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VoucherLinkageRepository, VOUCHER_LINKAGE_REPOSITORY } from '@domain/voucher-linkage/repository/voucher-linkage.repository';
import { VoucherLinkage, VoucherLinkageStatus } from '@domain/voucher-linkage/model/voucher-linkage';
import { UpdateVoucherLinkageAdminUseCase } from './update-voucher-linkage.admin.usecase';
import { UpdateVoucherLinkageDto, CompleteVoucherLinkageDto } from './dto/voucher-linkage.dto';

describe('UpdateVoucherLinkageAdminUseCase', () => {
  let useCase: UpdateVoucherLinkageAdminUseCase;
  let mockVoucherLinkageRepository: jest.Mocked<VoucherLinkageRepository>;

  beforeEach(async () => {
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
        UpdateVoucherLinkageAdminUseCase,
        {
          provide: VOUCHER_LINKAGE_REPOSITORY,
          useValue: mockVoucherLinkageRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateVoucherLinkageAdminUseCase>(UpdateVoucherLinkageAdminUseCase);
  });

  const createMockVoucherLinkage = (
    id: string,
    counselRequestId: string,
    status: VoucherLinkageStatus = VoucherLinkageStatus.PENDING,
    institutionName?: string,
  ) => {
    return VoucherLinkage.restore({
      id,
      counselRequestId,
      status,
      linkedInstitutionName: institutionName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  describe('바우처 연계 정보 수정', () => {
    it('연계 정보를 수정한다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const dto: UpdateVoucherLinkageDto = {
        linkedInstitutionName: '테스트 기관',
        linkedInstitutionPhone: '010-1234-5678',
        notes: '수정된 메모',
      };
      const adminId = 'admin-123';
      const mockLinkage = createMockVoucherLinkage('linkage-123', counselRequestId);

      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(mockLinkage);
      mockVoucherLinkageRepository.save.mockImplementation((linkage) => Promise.resolve(linkage));

      // When
      const result = await useCase.execute(counselRequestId, dto, adminId);

      // Then
      expect(result.linkedInstitutionName).toBe('테스트 기관');
      expect(result.linkedInstitutionPhone).toBe('010-1234-5678');
      expect(result.notes).toBe('수정된 메모');
      expect(mockVoucherLinkageRepository.save).toHaveBeenCalled();
    });

    it('존재하지 않는 연계 정보 수정 시 NotFoundException을 던진다', async () => {
      // Given
      const counselRequestId = 'non-existent-id';
      const dto: UpdateVoucherLinkageDto = { notes: '메모' };

      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute(counselRequestId, dto)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(counselRequestId, dto)).rejects.toThrow(
        `바우처 연계 정보를 찾을 수 없습니다: ${counselRequestId}`,
      );
    });

    it('기관명 없이 연계 완료 상태로 변경 시 ConflictException을 던진다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const dto: UpdateVoucherLinkageDto = {
        status: VoucherLinkageStatus.COMPLETED,
      };
      const mockLinkage = createMockVoucherLinkage('linkage-123', counselRequestId);

      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(mockLinkage);

      // When & Then
      await expect(useCase.execute(counselRequestId, dto)).rejects.toThrow(ConflictException);
      await expect(useCase.execute(counselRequestId, dto)).rejects.toThrow(
        '연계 완료 시 기관명은 필수입니다',
      );
    });

    it('기존 기관명이 있으면 기관명 없이도 연계 완료 상태로 변경할 수 있다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const dto: UpdateVoucherLinkageDto = {
        status: VoucherLinkageStatus.COMPLETED,
      };
      const mockLinkage = createMockVoucherLinkage(
        'linkage-123',
        counselRequestId,
        VoucherLinkageStatus.PENDING,
        '기존 기관명',
      );

      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(mockLinkage);
      mockVoucherLinkageRepository.save.mockImplementation((linkage) => Promise.resolve(linkage));

      // When
      const result = await useCase.execute(counselRequestId, dto);

      // Then
      expect(result.status).toBe(VoucherLinkageStatus.COMPLETED);
    });

    it('상태와 함께 기관명을 제공하면 연계 완료 상태로 변경된다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const dto: UpdateVoucherLinkageDto = {
        status: VoucherLinkageStatus.COMPLETED,
        linkedInstitutionName: '새 기관명',
      };
      const mockLinkage = createMockVoucherLinkage('linkage-123', counselRequestId);

      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(mockLinkage);
      mockVoucherLinkageRepository.save.mockImplementation((linkage) => Promise.resolve(linkage));

      // When
      const result = await useCase.execute(counselRequestId, dto);

      // Then
      expect(result.status).toBe(VoucherLinkageStatus.COMPLETED);
      expect(result.linkedInstitutionName).toBe('새 기관명');
    });
  });

  describe('바우처 연계 완료 처리', () => {
    it('연계 완료 처리를 수행한다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const dto: CompleteVoucherLinkageDto = {
        linkedInstitutionName: '부산시 청소년상담복지센터',
        linkedInstitutionPhone: '051-123-4567',
        linkedInstitutionAddress: '부산시 해운대구 123',
        linkedCounselorName: '김상담',
        notes: '연계 완료 메모',
      };
      const adminId = 'admin-123';
      const mockLinkage = createMockVoucherLinkage('linkage-123', counselRequestId);

      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(mockLinkage);
      mockVoucherLinkageRepository.save.mockImplementation((linkage) => Promise.resolve(linkage));

      // When
      const result = await useCase.completeLinkage(counselRequestId, dto, adminId);

      // Then
      expect(result.status).toBe(VoucherLinkageStatus.COMPLETED);
      expect(result.linkedInstitutionName).toBe('부산시 청소년상담복지센터');
      expect(result.linkedInstitutionPhone).toBe('051-123-4567');
      expect(result.linkedInstitutionAddress).toBe('부산시 해운대구 123');
      expect(result.linkedCounselorName).toBe('김상담');
      expect(result.notes).toBe('연계 완료 메모');
      expect(result.linkedAt).toBeDefined();
    });

    it('존재하지 않는 연계 정보 완료 처리 시 NotFoundException을 던진다', async () => {
      // Given
      const counselRequestId = 'non-existent-id';
      const dto: CompleteVoucherLinkageDto = {
        linkedInstitutionName: '테스트 기관',
      };

      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(null);

      // When & Then
      await expect(useCase.completeLinkage(counselRequestId, dto)).rejects.toThrow(NotFoundException);
    });

    it('이미 완료된 연계 정보에 완료 처리 시 ConflictException을 던진다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const dto: CompleteVoucherLinkageDto = {
        linkedInstitutionName: '테스트 기관',
      };
      const mockLinkage = createMockVoucherLinkage(
        'linkage-123',
        counselRequestId,
        VoucherLinkageStatus.COMPLETED,
        '기존 기관명',
      );

      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(mockLinkage);

      // When & Then
      await expect(useCase.completeLinkage(counselRequestId, dto)).rejects.toThrow(ConflictException);
      await expect(useCase.completeLinkage(counselRequestId, dto)).rejects.toThrow(
        '이미 연계 완료된 상태입니다',
      );
    });

    it('지정된 연계 일자로 완료 처리된다', async () => {
      // Given
      const counselRequestId = 'counsel-request-123';
      const linkedAt = '2024-01-15T10:00:00Z';
      const dto: CompleteVoucherLinkageDto = {
        linkedInstitutionName: '테스트 기관',
        linkedAt,
      };
      const mockLinkage = createMockVoucherLinkage('linkage-123', counselRequestId);

      mockVoucherLinkageRepository.findByCounselRequestId.mockResolvedValue(mockLinkage);
      mockVoucherLinkageRepository.save.mockImplementation((linkage) => Promise.resolve(linkage));

      // When
      const result = await useCase.completeLinkage(counselRequestId, dto);

      // Then
      expect(result.status).toBe(VoucherLinkageStatus.COMPLETED);
      expect(result.linkedAt).toEqual(new Date(linkedAt));
    });
  });
});
