import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminChatSessionDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional() userId: string | null;
  @ApiPropertyOptional() title: string | null;
  @ApiProperty() status: string;
  @ApiProperty() messageCount: number;
  @ApiPropertyOptional() childName: string | null;
  @ApiPropertyOptional() metadata: Record<string, unknown> | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
  @ApiPropertyOptional() duration: number | null;
}

export class AdminChatMessageDto {
  @ApiProperty() id: string;
  @ApiProperty() sessionId: string;
  @ApiProperty() role: string;
  @ApiProperty() content: string;
  @ApiPropertyOptional() metadata: Record<string, unknown> | null;
  @ApiProperty() createdAt: string;
}

export class AdminSessionDetailDto extends AdminChatSessionDto {
  @ApiProperty({ type: [AdminChatMessageDto] })
  messages: AdminChatMessageDto[];
}

export class PaginatedSessionsDto {
  @ApiProperty({ type: [AdminChatSessionDto] })
  data: AdminChatSessionDto[];

  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
  @ApiProperty() hasNext: boolean;
  @ApiProperty() hasPrev: boolean;
}

export class AdminSessionStatsDto {
  @ApiProperty() totalSessions: number;
  @ApiProperty() activeSessions: number;
  @ApiProperty() todayCreated: number;
  @ApiProperty() todayClosed: number;
  @ApiProperty() totalMessages: number;
}
