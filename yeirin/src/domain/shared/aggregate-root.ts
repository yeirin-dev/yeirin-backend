import { v4 as uuidv4 } from 'uuid';

/**
 * Aggregate Root 기반 클래스
 * - 엔티티의 최상위 루트
 * - ID로 식별
 * - 불변성 유지
 */
export abstract class AggregateRoot<T> {
  protected readonly _id: string;
  protected props: T;

  constructor(props: T, id?: string) {
    this._id = id || uuidv4();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  /**
   * ID 기반 동등성 비교
   */
  public equals(entity?: AggregateRoot<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    if (this === entity) {
      return true;
    }
    return this._id === entity._id;
  }
}
