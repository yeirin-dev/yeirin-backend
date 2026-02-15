import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PsychologicalStatus } from '@infrastructure/persistence/typeorm/entity/enums/psychological-status.enum';

export class AdminRiskLogDto {
  @ApiProperty() id: string;
  @ApiProperty() childId: string;
  @ApiProperty() childName: string;
  @ApiProperty({ enum: PsychologicalStatus }) previousStatus: PsychologicalStatus;
  @ApiProperty({ enum: PsychologicalStatus }) newStatus: PsychologicalStatus;
  @ApiProperty() reason: string;
  @ApiProperty() source: 'SOUL_E' | 'COUNSELOR' | 'SYSTEM';
  @ApiPropertyOptional() sessionId: string | null;
  @ApiProperty() isEscalation: boolean;
  @ApiProperty() createdAt: Date;
}

export class AdminRiskLogDetailDto extends AdminRiskLogDto {
  @ApiPropertyOptional() metadata: Record<string, unknown> | null;
}

export class AdminRiskStatsDto {
  @ApiProperty() totalLogs: number;
  @ApiProperty() escalationCount: number;
  @ApiProperty() todayCount: number;
  @ApiProperty() byStatus: {
    NORMAL: number;
    AT_RISK: number;
    HIGH_RISK: number;
  };
  @ApiProperty() bySource: {
    SOUL_E: number;
    COUNSELOR: number;
    SYSTEM: number;
  };
}

export class PaginatedRiskLogsDto {
  @ApiProperty({ type: [AdminRiskLogDto] })
  data: AdminRiskLogDto[];

  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
  @ApiProperty() hasNext: boolean;
  @ApiProperty() hasPrev: boolean;
}
