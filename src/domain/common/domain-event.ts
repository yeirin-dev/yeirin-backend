/**
 * Domain Event 기본 인터페이스
 * - Event Sourcing / CQRS 패턴
 * - 도메인에서 발생한 중요한 사건 기록
 */
export interface DomainEvent {
  eventName: string;
  occurredOn: Date;
  aggregateId: string;
}

/**
 * Aggregate Root 기본 클래스
 * - Domain Events 관리
 * - 불변성 보장
 */
export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  /**
   * Domain Event 추가
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Domain Events 조회
   */
  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents]; // 복사본 반환
  }

  /**
   * Domain Events 클리어
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
