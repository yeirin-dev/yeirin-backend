import { DomainEvent } from '@domain/common/domain-event';

/**
 * 회원가입 완료 이벤트
 * - 이메일 인증 메일 발송 트리거
 * - 환영 메시지 발송
 * - 분석 시스템 연동
 */
export class UserRegistered implements DomainEvent {
  public readonly eventName = 'UserRegistered';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly role: string,
  ) {
    this.occurredOn = new Date();
  }
}
