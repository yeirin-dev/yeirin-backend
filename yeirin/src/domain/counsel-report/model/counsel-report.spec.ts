import { CounselReport, CreateCounselReportProps } from './counsel-report';
import { ReportStatus } from './value-objects/report-status';

describe('CounselReport Aggregate Root', () => {
  // 테스트용 기본 Props
  const validProps: CreateCounselReportProps = {
    counselRequestId: '123e4567-e89b-12d3-a456-426614174000',
    childId: '123e4567-e89b-12d3-a456-426614174001',
    counselorId: '123e4567-e89b-12d3-a456-426614174002',
    institutionId: '123e4567-e89b-12d3-a456-426614174003',
    sessionNumber: 1,
    reportDate: new Date('2025-01-15'),
    centerName: '행복한 심리상담센터',
    counselorSignature: null,
    counselReason: 'ADHD 진단 후 집중력 향상을 위한 심리 상담',
    counselContent: '아동과의 1:1 대화를 통해 최근 학교생활에서의 어려움을 탐색하였습니다.',
    centerFeedback: null,
    homeFeedback: null,
    attachmentUrls: [],
  };

  describe('생성', () => {
    it('유효한 정보로 면담결과지를 생성한다', () => {
      // When
      const result = CounselReport.create(validProps);

      // Then
      expect(result.isSuccess).toBe(true);
      const report = result.getValue();
      expect(report.sessionNumber).toBe(1);
      expect(report.status).toBe(ReportStatus.DRAFT);
      expect(report.submittedAt).toBeNull();
      expect(report.reviewedAt).toBeNull();
      expect(report.guardianFeedback).toBeNull();
    });

    it('회차가 1 미만이면 생성에 실패한다', () => {
      // Given
      const invalidProps = { ...validProps, sessionNumber: 0 };

      // When
      const result = CounselReport.create(invalidProps);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_SESSION_NUMBER');
    });

    it('필수 필드가 누락되면 생성에 실패한다', () => {
      // Given
      const invalidProps = { ...validProps, counselRequestId: '' };

      // When
      const result = CounselReport.create(invalidProps);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('상담 사유가 비어있으면 생성에 실패한다', () => {
      // Given
      const invalidProps = { ...validProps, counselReason: '   ' };

      // When
      const result = CounselReport.create(invalidProps);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('MISSING_COUNSEL_CONTENT');
    });

    it('상담 내용이 비어있으면 생성에 실패한다', () => {
      // Given
      const invalidProps = { ...validProps, counselContent: '' };

      // When
      const result = CounselReport.create(invalidProps);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('MISSING_COUNSEL_CONTENT');
    });

    it('센터명이 비어있으면 생성에 실패한다', () => {
      // Given
      const invalidProps = { ...validProps, centerName: '  ' };

      // When
      const result = CounselReport.create(invalidProps);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('MISSING_CENTER_NAME');
    });
  });

  describe('수정', () => {
    it('DRAFT 상태에서 상담 내용을 수정할 수 있다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();
      const newContent = '새로운 상담 내용입니다. 아동의 변화가 관찰되었습니다.';

      // When
      const result = report.update({ counselContent: newContent });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(report.counselContent).toBe(newContent);
    });

    it('DRAFT 상태에서 피드백을 수정할 수 있다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();

      // When
      const result = report.update({
        centerFeedback: '센터에 전하는 피드백입니다.',
        homeFeedback: '가정에 전하는 피드백입니다.',
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(report.centerFeedback).toBe('센터에 전하는 피드백입니다.');
      expect(report.homeFeedback).toBe('가정에 전하는 피드백입니다.');
    });

    it('SUBMITTED 상태에서는 수정할 수 없다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();
      report.submit();

      // When
      const result = report.update({ counselContent: '수정 시도' });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('CANNOT_UPDATE_SUBMITTED_REPORT');
    });

    it('상담 사유를 빈 문자열로 수정할 수 없다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();

      // When
      const result = report.update({ counselReason: '   ' });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_COUNSEL_REASON');
    });

    it('상담 내용을 빈 문자열로 수정할 수 없다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();

      // When
      const result = report.update({ counselContent: '' });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_COUNSEL_CONTENT');
    });
  });

  describe('제출', () => {
    it('DRAFT 상태에서 제출할 수 있다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();

      // When
      const result = report.submit();

      // Then
      expect(result.isSuccess).toBe(true);
      expect(report.status).toBe(ReportStatus.SUBMITTED);
      expect(report.submittedAt).not.toBeNull();
    });

    it('필수 내용이 없으면 제출할 수 없다', () => {
      // Given
      const propsWithoutReason = { ...validProps, counselReason: '   ' };
      const report = CounselReport.create({
        ...validProps,
        counselReason: '최소 10자 이상',
      }).getValue();
      // 수정으로 비우기 시도는 막혀있으므로, restore로 강제 생성
      const reportWithEmptyContent = CounselReport.restore({
        id: '123',
        ...validProps,
        counselReason: '   ',
        status: ReportStatus.DRAFT,
        submittedAt: null,
        reviewedAt: null,
        guardianFeedback: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // When
      const result = reportWithEmptyContent.submit();

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INCOMPLETE_REPORT');
    });

    it('이미 제출된 상태에서는 다시 제출할 수 없다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();
      report.submit();

      // When
      const result = report.submit();

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  describe('보호자 확인', () => {
    it('SUBMITTED 상태에서 확인 처리할 수 있다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();
      report.submit();

      // When
      const result = report.markAsReviewed();

      // Then
      expect(result.isSuccess).toBe(true);
      expect(report.status).toBe(ReportStatus.REVIEWED);
      expect(report.reviewedAt).not.toBeNull();
    });

    it('DRAFT 상태에서는 확인 처리할 수 없다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();

      // When
      const result = report.markAsReviewed();

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  describe('보호자 승인', () => {
    it('REVIEWED 상태에서 피드백과 함께 승인할 수 있다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();
      report.submit();
      report.markAsReviewed();
      const feedback = '상담 내용 잘 확인했습니다. 집에서도 노력하겠습니다.';

      // When
      const result = report.approveWithFeedback(feedback);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(report.status).toBe(ReportStatus.APPROVED);
      expect(report.guardianFeedback).toBe(feedback);
    });

    it('피드백 없이는 승인할 수 없다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();
      report.submit();
      report.markAsReviewed();

      // When
      const result = report.approveWithFeedback('   ');

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_FEEDBACK');
    });

    it('SUBMITTED 상태에서는 직접 승인할 수 없다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();
      report.submit();

      // When
      const result = report.approveWithFeedback('피드백');

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  describe('반려', () => {
    it('SUBMITTED 상태에서 DRAFT로 반려할 수 있다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();
      report.submit();

      // When
      const result = report.reject();

      // Then
      expect(result.isSuccess).toBe(true);
      expect(report.status).toBe(ReportStatus.DRAFT);
      expect(report.submittedAt).toBeNull();
    });

    it('DRAFT 상태에서는 반려할 수 없다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();

      // When
      const result = report.reject();

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('REVIEWED 상태에서는 반려할 수 없다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();
      report.submit();
      report.markAsReviewed();

      // When
      const result = report.reject();

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  describe('권한 확인', () => {
    it('DRAFT 상태에서는 상담사가 수정할 수 있다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();

      // Then
      expect(report.canEdit()).toBe(true);
    });

    it('SUBMITTED 상태에서는 상담사가 수정할 수 없다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();
      report.submit();

      // Then
      expect(report.canEdit()).toBe(false);
    });

    it('DRAFT 상태는 보호자에게 보이지 않는다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();

      // Then
      expect(report.isVisibleToGuardian()).toBe(false);
    });

    it('SUBMITTED 상태부터는 보호자에게 보인다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();
      report.submit();

      // Then
      expect(report.isVisibleToGuardian()).toBe(true);
    });
  });

  describe('전체 플로우', () => {
    it('생성 → 수정 → 제출 → 확인 → 승인 전체 플로우가 정상 동작한다', () => {
      // 1. 생성 (DRAFT)
      const report = CounselReport.create(validProps).getValue();
      expect(report.status).toBe(ReportStatus.DRAFT);
      expect(report.canEdit()).toBe(true);

      // 2. 수정
      const updateResult = report.update({
        counselContent: '수정된 상담 내용입니다. 아동의 변화가 관찰되었습니다.',
      });
      expect(updateResult.isSuccess).toBe(true);

      // 3. 제출 (DRAFT → SUBMITTED)
      const submitResult = report.submit();
      expect(submitResult.isSuccess).toBe(true);
      expect(report.status).toBe(ReportStatus.SUBMITTED);
      expect(report.submittedAt).not.toBeNull();
      expect(report.canEdit()).toBe(false);

      // 4. 보호자 확인 (SUBMITTED → REVIEWED)
      const reviewResult = report.markAsReviewed();
      expect(reviewResult.isSuccess).toBe(true);
      expect(report.status).toBe(ReportStatus.REVIEWED);
      expect(report.reviewedAt).not.toBeNull();

      // 5. 보호자 승인 (REVIEWED → APPROVED)
      const feedback = '상담 내용 확인했습니다. 감사합니다.';
      const approveResult = report.approveWithFeedback(feedback);
      expect(approveResult.isSuccess).toBe(true);
      expect(report.status).toBe(ReportStatus.APPROVED);
      expect(report.guardianFeedback).toBe(feedback);
    });

    it('제출 → 반려 → 재수정 → 재제출 플로우가 정상 동작한다', () => {
      // 1. 생성 및 제출
      const report = CounselReport.create(validProps).getValue();
      report.submit();
      expect(report.status).toBe(ReportStatus.SUBMITTED);

      // 2. 반려 (SUBMITTED → DRAFT)
      const rejectResult = report.reject();
      expect(rejectResult.isSuccess).toBe(true);
      expect(report.status).toBe(ReportStatus.DRAFT);
      expect(report.submittedAt).toBeNull();

      // 3. 재수정
      const updateResult = report.update({
        counselContent: '반려 후 수정된 내용입니다.',
      });
      expect(updateResult.isSuccess).toBe(true);

      // 4. 재제출
      const resubmitResult = report.submit();
      expect(resubmitResult.isSuccess).toBe(true);
      expect(report.status).toBe(ReportStatus.SUBMITTED);
    });
  });

  describe('Getters', () => {
    it('모든 속성을 올바르게 반환한다', () => {
      // Given
      const report = CounselReport.create(validProps).getValue();

      // Then
      expect(report.id).toBeDefined();
      expect(report.counselRequestId).toBe(validProps.counselRequestId);
      expect(report.childId).toBe(validProps.childId);
      expect(report.counselorId).toBe(validProps.counselorId);
      expect(report.institutionId).toBe(validProps.institutionId);
      expect(report.sessionNumber).toBe(validProps.sessionNumber);
      expect(report.reportDate).toEqual(validProps.reportDate);
      expect(report.centerName).toBe(validProps.centerName);
      expect(report.counselReason).toBe(validProps.counselReason);
      expect(report.counselContent).toBe(validProps.counselContent);
      expect(report.attachmentUrls).toEqual([]);
      expect(report.createdAt).toBeDefined();
      expect(report.updatedAt).toBeDefined();
    });
  });
});
