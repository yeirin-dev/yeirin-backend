import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PsychologicalStatusLogEntity } from '@infrastructure/persistence/typeorm/entity/psychological-status-log.entity';
import { PsychologicalStatus } from '@infrastructure/persistence/typeorm/entity/enums/psychological-status.enum';
import { AdminRiskManagementService } from './admin-risk-management.service';
import { AdminRiskLogQueryDto } from './dto/admin-risk-log-query.dto';

describe('AdminRiskManagementService', () => {
  let service: AdminRiskManagementService;

  // QueryBuilder mock chain
  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getCount: jest.fn(),
    getRawMany: jest.fn(),
  };

  const mockRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    count: jest.fn(),
    findOne: jest.fn(),
  };

  const mockLog = {
    id: 'log-1',
    childId: 'child-1',
    child: { id: 'child-1', name: '김예이' },
    previousStatus: PsychologicalStatus.NORMAL,
    newStatus: PsychologicalStatus.AT_RISK,
    reason: '대화 중 불안 징후 감지',
    source: 'SOUL_E' as const,
    sessionId: 'session-1',
    isEscalation: true,
    metadata: { keywords: ['불안', '걱정'] },
    createdAt: new Date('2024-01-15T10:00:00Z'),
  };

  const mockLog2 = {
    id: 'log-2',
    childId: 'child-2',
    child: { id: 'child-2', name: '이린이' },
    previousStatus: PsychologicalStatus.AT_RISK,
    newStatus: PsychologicalStatus.NORMAL,
    reason: '상담 후 상태 개선',
    source: 'COUNSELOR' as const,
    sessionId: null,
    isEscalation: false,
    metadata: null,
    createdAt: new Date('2024-01-16T14:00:00Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset QueryBuilder mock chain
    mockQueryBuilder.leftJoinAndSelect.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.orderBy.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.andWhere.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.skip.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.take.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.where.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.addSelect.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.groupBy.mockReturnValue(mockQueryBuilder);
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminRiskManagementService,
        {
          provide: getRepositoryToken(PsychologicalStatusLogEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AdminRiskManagementService>(AdminRiskManagementService);
  });

  it('위험 로그 목록을 페이지네이션하여 조회한다', async () => {
    // Given
    const query: AdminRiskLogQueryDto = { page: 1, limit: 10 };
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockLog, mockLog2], 2]);

    // When
    const result = await service.getRiskLogs(query);

    // Then
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(1);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(false);
    expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
    expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
  });

  it('아동 이름으로 위험 로그를 필터링한다', async () => {
    // Given
    const query: AdminRiskLogQueryDto = { childName: '김예이', page: 1, limit: 10 };
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockLog], 1]);

    // When
    const result = await service.getRiskLogs(query);

    // Then
    expect(result.data).toHaveLength(1);
    expect(result.data[0].childName).toBe('김예이');
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'child.name ILIKE :childName',
      { childName: '%김예이%' },
    );
  });

  it('상태로 위험 로그를 필터링한다', async () => {
    // Given
    const query: AdminRiskLogQueryDto = {
      newStatus: PsychologicalStatus.AT_RISK,
      page: 1,
      limit: 10,
    };
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockLog], 1]);

    // When
    const result = await service.getRiskLogs(query);

    // Then
    expect(result.data).toHaveLength(1);
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'log.newStatus = :newStatus',
      { newStatus: PsychologicalStatus.AT_RISK },
    );
  });

  it('위험도 상승만 필터링한다', async () => {
    // Given
    const query: AdminRiskLogQueryDto = { escalationOnly: true, page: 1, limit: 10 };
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockLog], 1]);

    // When
    const result = await service.getRiskLogs(query);

    // Then
    expect(result.data).toHaveLength(1);
    expect(result.data[0].isEscalation).toBe(true);
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'log.isEscalation = :isEscalation',
      { isEscalation: true },
    );
  });

  it('위험 로그 통계를 조회한다', async () => {
    // Given
    mockRepository.count
      .mockResolvedValueOnce(50) // totalLogs
      .mockResolvedValueOnce(15); // escalationCount
    mockQueryBuilder.getCount.mockResolvedValue(3); // todayCount
    mockQueryBuilder.getRawMany
      .mockResolvedValueOnce([
        { status: 'NORMAL', count: '20' },
        { status: 'AT_RISK', count: '18' },
        { status: 'HIGH_RISK', count: '12' },
      ]) // byStatus
      .mockResolvedValueOnce([
        { source: 'SOUL_E', count: '30' },
        { source: 'COUNSELOR', count: '15' },
        { source: 'SYSTEM', count: '5' },
      ]); // bySource

    // When
    const result = await service.getStats();

    // Then
    expect(result.totalLogs).toBe(50);
    expect(result.escalationCount).toBe(15);
    expect(result.todayCount).toBe(3);
    expect(result.byStatus).toEqual({ NORMAL: 20, AT_RISK: 18, HIGH_RISK: 12 });
    expect(result.bySource).toEqual({ SOUL_E: 30, COUNSELOR: 15, SYSTEM: 5 });
  });

  it('위험 로그 상세를 조회한다', async () => {
    // Given
    mockRepository.findOne.mockResolvedValue(mockLog);

    // When
    const result = await service.getRiskLogDetail('log-1');

    // Then
    expect(result.id).toBe('log-1');
    expect(result.childName).toBe('김예이');
    expect(result.previousStatus).toBe(PsychologicalStatus.NORMAL);
    expect(result.newStatus).toBe(PsychologicalStatus.AT_RISK);
    expect(result.reason).toBe('대화 중 불안 징후 감지');
    expect(result.metadata).toEqual({ keywords: ['불안', '걱정'] });
    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'log-1' },
      relations: ['child'],
    });
  });

  it('존재하지 않는 위험 로그 조회 시 NotFoundException을 던진다', async () => {
    // Given
    mockRepository.findOne.mockResolvedValue(null);

    // When & Then
    await expect(service.getRiskLogDetail('non-existent-id')).rejects.toThrow(NotFoundException);
  });
});
