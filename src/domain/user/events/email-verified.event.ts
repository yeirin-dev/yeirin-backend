import { DomainEvent } from '@domain/common/domain-event';

/**
 * 이메일 인증 완료 이벤트
 * - 계정 활성화
 * - 온보딩 프로세스 시작
 */
export class EmailVerified implements DomainEvent {
  public readonly eventName = 'EmailVerified';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
  ) {
    this.occurredOn = new Date();
  }
}
