import { Injectable, Logger } from '@nestjs/common';
import {
  SoulEClient,
  AdminSessionFilters,
  PaginatedAdminSessions,
  AdminSessionStats,
  AdminSessionDetailResponse,
} from '@infrastructure/external/soul-e.client';
import { AdminSessionQueryDto } from './dto/admin-session-query.dto';

@Injectable()
export class AdminSessionService {
  private readonly logger = new Logger(AdminSessionService.name);

  constructor(private readonly soulEClient: SoulEClient) {}

  /**
   * 세션 목록을 페이지네이션하여 조회한다
   */
  async getSessions(query: AdminSessionQueryDto): Promise<PaginatedAdminSessions> {
    const filters: AdminSessionFilters = {
      childName: query.childName,
      status: query.status,
      page: query.page,
      limit: query.limit,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    };

    this.logger.log(`세션 목록 조회 - filters: ${JSON.stringify(filters)}`);
    return this.soulEClient.getAdminSessions(filters);
  }

  /**
   * 세션 통계를 조회한다
   */
  async getSessionStats(): Promise<AdminSessionStats> {
    this.logger.log('세션 통계 조회');
    return this.soulEClient.getAdminSessionStats();
  }

  /**
   * 세션 상세 정보와 메시지를 조회한다
   */
  async getSessionDetail(sessionId: string): Promise<AdminSessionDetailResponse> {
    this.logger.log(`세션 상세 조회 - sessionId: ${sessionId}`);
    return this.soulEClient.getAdminSessionDetail(sessionId);
  }
}
