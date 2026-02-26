import { VoucherLinkage, VoucherLinkageStatus } from './voucher-linkage';

describe('VoucherLinkage', () => {
  describe('create', () => {
    it('유효한 ID와 상담의뢰지 ID로 연계 정보를 생성한다', () => {
      // Given
      const props = {
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
        createdBy: 'admin-789',
        notes: '테스트 메모',
      };

      // When
      const result = VoucherLinkage.create(props);

      // Then
      expect(result.isSuccess).toBe(true);
      const linkage = result.getValue();
      expect(linkage.id).toBe('linkage-123');
      expect(linkage.counselRequestId).toBe('counsel-request-456');
      expect(linkage.status).toBe(VoucherLinkageStatus.PENDING);
      expect(linkage.notes).toBe('테스트 메모');
      expect(linkage.createdBy).toBe('admin-789');
    });

    it('빈 ID로 생성 시 실패한다', () => {
      // Given
      const props = {
        id: '',
        counselRequestId: 'counsel-request-456',
      };

      // When
      const result = VoucherLinkage.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toBe('바우처 연계 ID는 필수입니다');
    });

    it('빈 상담의뢰지 ID로 생성 시 실패한다', () => {
      // Given
      const props = {
        id: 'linkage-123',
        counselRequestId: '',
      };

      // When
      const result = VoucherLinkage.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toBe('상담의뢰지 ID는 필수입니다');
    });

    it('공백만 있는 ID로 생성 시 실패한다', () => {
      // Given
      const props = {
        id: '   ',
        counselRequestId: 'counsel-request-456',
      };

      // When
      const result = VoucherLinkage.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toBe('바우처 연계 ID는 필수입니다');
    });
  });

  describe('restore', () => {
    it('DB에서 복원된 데이터로 연계 정보를 생성한다', () => {
      // Given
      const props = {
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
        status: VoucherLinkageStatus.COMPLETED,
        linkedInstitutionName: '테스트 기관',
        linkedInstitutionPhone: '010-1234-5678',
        linkedInstitutionAddress: '부산시 해운대구',
        linkedCounselorName: '김상담',
        linkedAt: new Date('2024-01-15'),
        notes: '메모',
        createdBy: 'admin-123',
        updatedBy: 'admin-456',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      // When
      const linkage = VoucherLinkage.restore(props);

      // Then
      expect(linkage.id).toBe('linkage-123');
      expect(linkage.status).toBe(VoucherLinkageStatus.COMPLETED);
      expect(linkage.linkedInstitutionName).toBe('테스트 기관');
      expect(linkage.isCompleted()).toBe(true);
    });
  });

  describe('completeLinkage', () => {
    it('기관명과 함께 연계 완료 처리를 수행한다', () => {
      // Given
      const linkage = VoucherLinkage.create({
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
      }).getValue();

      // When
      const result = linkage.completeLinkage({
        linkedInstitutionName: '부산시 청소년상담복지센터',
        linkedInstitutionPhone: '051-123-4567',
        linkedCounselorName: '김상담',
        updatedBy: 'admin-789',
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(linkage.status).toBe(VoucherLinkageStatus.COMPLETED);
      expect(linkage.linkedInstitutionName).toBe('부산시 청소년상담복지센터');
      expect(linkage.linkedAt).toBeDefined();
      expect(linkage.isCompleted()).toBe(true);
    });

    it('빈 기관명으로 연계 완료 시 실패한다', () => {
      // Given
      const linkage = VoucherLinkage.create({
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
      }).getValue();

      // When
      const result = linkage.completeLinkage({
        linkedInstitutionName: '',
      });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toBe('연계 기관명은 필수입니다');
    });

    it('지정된 연계 일자로 완료 처리된다', () => {
      // Given
      const linkage = VoucherLinkage.create({
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
      }).getValue();
      const linkedAt = new Date('2024-01-15');

      // When
      const result = linkage.completeLinkage({
        linkedInstitutionName: '테스트 기관',
        linkedAt,
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(linkage.linkedAt).toEqual(linkedAt);
    });
  });

  describe('update', () => {
    it('연계 정보를 수정한다', () => {
      // Given
      const linkage = VoucherLinkage.create({
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
        notes: '초기 메모',
      }).getValue();

      // When
      const result = linkage.update({
        linkedInstitutionName: '새 기관명',
        notes: '수정된 메모',
        updatedBy: 'admin-789',
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(linkage.linkedInstitutionName).toBe('새 기관명');
      expect(linkage.notes).toBe('수정된 메모');
      expect(linkage.updatedBy).toBe('admin-789');
    });

    it('부분 필드만 수정할 수 있다', () => {
      // Given
      const linkage = VoucherLinkage.restore({
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
        status: VoucherLinkageStatus.PENDING,
        linkedInstitutionName: '기존 기관명',
        linkedInstitutionPhone: '010-1111-1111',
        notes: '기존 메모',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // When
      const result = linkage.update({
        linkedInstitutionPhone: '010-2222-2222',
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(linkage.linkedInstitutionName).toBe('기존 기관명');
      expect(linkage.linkedInstitutionPhone).toBe('010-2222-2222');
      expect(linkage.notes).toBe('기존 메모');
    });
  });

  describe('changeStatus', () => {
    it('기관 정보가 있으면 COMPLETED로 상태를 변경할 수 있다', () => {
      // Given
      const linkage = VoucherLinkage.restore({
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
        status: VoucherLinkageStatus.PENDING,
        linkedInstitutionName: '테스트 기관',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // When
      const result = linkage.changeStatus(VoucherLinkageStatus.COMPLETED, 'admin-789');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(linkage.status).toBe(VoucherLinkageStatus.COMPLETED);
      expect(linkage.updatedBy).toBe('admin-789');
    });

    it('기관 정보 없이 COMPLETED로 상태 변경 시 실패한다', () => {
      // Given
      const linkage = VoucherLinkage.create({
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
      }).getValue();

      // When
      const result = linkage.changeStatus(VoucherLinkageStatus.COMPLETED);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toBe('연계 완료 시 기관 정보가 필요합니다');
    });

    it('COMPLETED에서 PENDING으로 상태를 롤백할 수 있다', () => {
      // Given
      const linkage = VoucherLinkage.restore({
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
        status: VoucherLinkageStatus.COMPLETED,
        linkedInstitutionName: '테스트 기관',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // When
      const result = linkage.changeStatus(VoucherLinkageStatus.PENDING);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(linkage.status).toBe(VoucherLinkageStatus.PENDING);
    });
  });

  describe('submitLinkageInfo', () => {
    it('Guardian이 바우처 선정 및 플랫폼 연계 희망 정보를 제출한다', () => {
      // Given
      const linkage = VoucherLinkage.create({
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
      }).getValue();

      // When
      const result = linkage.submitLinkageInfo({
        isVoucherConfirmed: true,
        voucherType: '심리치유',
        wantsPlatformLinkage: true,
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(linkage.isVoucherConfirmed).toBe(true);
      expect(linkage.voucherType).toBe('심리치유');
      expect(linkage.wantsPlatformLinkage).toBe(true);
      expect(linkage.linkageDeclineReason).toBeUndefined();
      expect(linkage.linkageInfoSubmitted).toBe(true);
    });

    it('Guardian이 바우처 미선정 정보를 제출한다', () => {
      // Given
      const linkage = VoucherLinkage.create({
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
      }).getValue();

      // When
      const result = linkage.submitLinkageInfo({
        isVoucherConfirmed: false,
        wantsPlatformLinkage: false,
        linkageDeclineReason: '바우처 미선정',
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(linkage.isVoucherConfirmed).toBe(false);
      expect(linkage.voucherType).toBeUndefined();
      expect(linkage.wantsPlatformLinkage).toBe(false);
      expect(linkage.linkageDeclineReason).toBe('바우처 미선정');
      expect(linkage.linkageInfoSubmitted).toBe(true);
    });

    it('연계 미희망 사유와 함께 제출한다', () => {
      // Given
      const linkage = VoucherLinkage.create({
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
      }).getValue();

      // When
      const result = linkage.submitLinkageInfo({
        isVoucherConfirmed: true,
        voucherType: '정서발달',
        wantsPlatformLinkage: false,
        linkageDeclineReason: '이미 다른 기관과 상담 중입니다',
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(linkage.isVoucherConfirmed).toBe(true);
      expect(linkage.voucherType).toBe('정서발달');
      expect(linkage.wantsPlatformLinkage).toBe(false);
      expect(linkage.linkageDeclineReason).toBe('이미 다른 기관과 상담 중입니다');
      expect(linkage.linkageInfoSubmitted).toBe(true);
    });

    it('이미 제출된 정보를 다시 제출하면 덮어쓴다', () => {
      // Given
      const linkage = VoucherLinkage.create({
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
      }).getValue();

      linkage.submitLinkageInfo({
        isVoucherConfirmed: false,
        wantsPlatformLinkage: false,
        linkageDeclineReason: '초기 사유',
      });

      // When
      const result = linkage.submitLinkageInfo({
        isVoucherConfirmed: true,
        voucherType: '심리치유',
        wantsPlatformLinkage: true,
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(linkage.isVoucherConfirmed).toBe(true);
      expect(linkage.voucherType).toBe('심리치유');
      expect(linkage.wantsPlatformLinkage).toBe(true);
      expect(linkage.linkageDeclineReason).toBeUndefined();
      expect(linkage.linkageInfoSubmitted).toBe(true);
    });

    it('제출 시 updatedAt이 갱신된다', () => {
      // Given
      const linkage = VoucherLinkage.create({
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
      }).getValue();
      const beforeUpdate = linkage.updatedAt;

      // When (약간의 시간 차이를 위해)
      const result = linkage.submitLinkageInfo({
        isVoucherConfirmed: true,
        voucherType: '심리치유',
        wantsPlatformLinkage: true,
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(linkage.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });

  describe('restore with linkage info', () => {
    it('제출된 연계 정보가 포함된 상태로 복원한다', () => {
      // Given
      const props = {
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
        status: VoucherLinkageStatus.PENDING,
        isVoucherConfirmed: true,
        voucherType: '심리치유',
        wantsPlatformLinkage: true,
        linkageInfoSubmitted: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      // When
      const linkage = VoucherLinkage.restore(props);

      // Then
      expect(linkage.isVoucherConfirmed).toBe(true);
      expect(linkage.voucherType).toBe('심리치유');
      expect(linkage.wantsPlatformLinkage).toBe(true);
      expect(linkage.linkageInfoSubmitted).toBe(true);
    });

    it('linkageInfoSubmitted가 undefined이면 false로 기본값 설정된다', () => {
      // Given
      const props = {
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
        status: VoucherLinkageStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // When
      const linkage = VoucherLinkage.restore(props);

      // Then
      expect(linkage.linkageInfoSubmitted).toBe(false);
    });
  });

  describe('상태 확인 메서드', () => {
    it('PENDING 상태이면 isPending()이 true를 반환한다', () => {
      // Given
      const linkage = VoucherLinkage.create({
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
      }).getValue();

      // When & Then
      expect(linkage.isPending()).toBe(true);
      expect(linkage.isCompleted()).toBe(false);
    });

    it('COMPLETED 상태이면 isCompleted()가 true를 반환한다', () => {
      // Given
      const linkage = VoucherLinkage.restore({
        id: 'linkage-123',
        counselRequestId: 'counsel-request-456',
        status: VoucherLinkageStatus.COMPLETED,
        linkedInstitutionName: '테스트 기관',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // When & Then
      expect(linkage.isCompleted()).toBe(true);
      expect(linkage.isPending()).toBe(false);
    });
  });
});
