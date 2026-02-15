import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AdminSessionService } from './admin-session.service';
import {
  SoulEClient,
  PaginatedAdminSessions,
  AdminSessionStats,
  AdminSessionDetailResponse,
} from '@infrastructure/external/soul-e.client';
import { AdminSessionQueryDto } from './dto/admin-session-query.dto';

describe('AdminSessionService', () => {
  let service: AdminSessionService;
  let soulEClient: jest.Mocked<SoulEClient>;

  const mockPaginatedSessions: PaginatedAdminSessions = {
    data: [
      {
        id: 'session-1',
        userId: 'child-1',
        title: '소울이와의 대화',
        status: 'active',
        messageCount: 5,
        childName: '김예이',
        metadata: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T01:00:00Z',
        duration: 3600,
      },
      {
        id: 'session-2',
        userId: 'child-2',
        title: '두 번째 대화',
        status: 'closed',
        messageCount: 10,
        childName: '이린이',
        metadata: null,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:30:00Z',
        duration: 1800,
      },
    ],
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  const mockSessionStats: AdminSessionStats = {
    totalSessions: 100,
    activeSessions: 5,
    todayCreated: 3,
    todayClosed: 2,
    totalMessages: 1500,
  };

  const mockSessionDetail: AdminSessionDetailResponse = {
    id: 'session-1',
    userId: 'child-1',
    title: '소울이와의 대화',
    status: 'active',
    messageCount: 2,
    childName: '김예이',
    metadata: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T01:00:00Z',
    duration: 3600,
    messages: [
      {
        id: 'msg-1',
        sessionId: 'session-1',
        role: 'user',
        content: '안녕 소울이!',
        metadata: null,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'msg-2',
        sessionId: 'session-1',
        role: 'assistant',
        content: '안녕! 오늘 기분이 어때?',
        metadata: null,
        createdAt: '2024-01-01T00:00:05Z',
      },
    ],
  };

  beforeEach(async () => {
    const mockSoulEClient = {
      getAdminSessions: jest.fn(),
      getAdminSessionStats: jest.fn(),
      getAdminSessionDetail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSessionService,
        { provide: SoulEClient, useValue: mockSoulEClient },
      ],
    }).compile();

    service = module.get<AdminSessionService>(AdminSessionService);
    soulEClient = module.get(SoulEClient);
  });

  it('세션 목록을 페이지네이션하여 조회한다', async () => {
    // Given
    const query: AdminSessionQueryDto = { page: 1, limit: 10 };
    soulEClient.getAdminSessions.mockResolvedValue(mockPaginatedSessions);

    // When
    const result = await service.getSessions(query);

    // Then
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(soulEClient.getAdminSessions).toHaveBeenCalledWith({
      childName: undefined,
      status: undefined,
      page: 1,
      limit: 10,
      dateFrom: undefined,
      dateTo: undefined,
    });
  });

  it('아동 이름으로 세션을 필터링한다', async () => {
    // Given
    const query: AdminSessionQueryDto = { childName: '김예이', page: 1, limit: 10 };
    const filteredResult: PaginatedAdminSessions = {
      ...mockPaginatedSessions,
      data: [mockPaginatedSessions.data[0]],
      total: 1,
    };
    soulEClient.getAdminSessions.mockResolvedValue(filteredResult);

    // When
    const result = await service.getSessions(query);

    // Then
    expect(result.data).toHaveLength(1);
    expect(result.data[0].childName).toBe('김예이');
    expect(soulEClient.getAdminSessions).toHaveBeenCalledWith(
      expect.objectContaining({ childName: '김예이' }),
    );
  });

  it('세션 통계를 조회한다', async () => {
    // Given
    soulEClient.getAdminSessionStats.mockResolvedValue(mockSessionStats);

    // When
    const result = await service.getSessionStats();

    // Then
    expect(result.totalSessions).toBe(100);
    expect(result.activeSessions).toBe(5);
    expect(result.todayCreated).toBe(3);
    expect(result.todayClosed).toBe(2);
    expect(result.totalMessages).toBe(1500);
  });

  it('세션 상세 정보와 메시지를 조회한다', async () => {
    // Given
    soulEClient.getAdminSessionDetail.mockResolvedValue(mockSessionDetail);

    // When
    const result = await service.getSessionDetail('session-1');

    // Then
    expect(result.id).toBe('session-1');
    expect(result.childName).toBe('김예이');
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[1].role).toBe('assistant');
  });

  it('Soul-E 서비스 장애 시 적절한 에러를 반환한다', async () => {
    // Given
    soulEClient.getAdminSessions.mockRejectedValue(
      new HttpException(
        { statusCode: 503, message: 'Soul-E service unavailable', service: 'soul-e' },
        HttpStatus.SERVICE_UNAVAILABLE,
      ),
    );

    // When & Then
    await expect(service.getSessions({ page: 1, limit: 10 })).rejects.toThrow(HttpException);
    await expect(service.getSessions({ page: 1, limit: 10 })).rejects.toThrow(
      expect.objectContaining({ status: HttpStatus.SERVICE_UNAVAILABLE }),
    );
  });
});
