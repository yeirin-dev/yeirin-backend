import { DomainError, Result } from '@domain/common/result';

/**
 * 주소 정보를 담는 Value Object
 */
export interface AddressProps {
  /** 기본 주소 */
  address: string;
  /** 상세 주소 (선택) */
  addressDetail?: string;
  /** 우편번호 (선택) */
  postalCode?: string;
}

/**
 * 주소 Value Object
 * - 기본 주소, 상세 주소, 우편번호를 포함
 */
export class Address {
  private static readonly MAX_ADDRESS_LENGTH = 200;
  private static readonly MAX_DETAIL_LENGTH = 100;
  private static readonly POSTAL_CODE_PATTERN = /^[0-9]{5}$/;

  private constructor(
    private readonly _address: string,
    private readonly _addressDetail: string | null,
    private readonly _postalCode: string | null,
  ) {}

  /**
   * 주소 생성 (정적 팩토리 메서드)
   */
  static create(props: AddressProps): Result<Address, DomainError> {
    const trimmedAddress = props.address?.trim();

    if (!trimmedAddress) {
      return Result.fail(new DomainError('주소는 필수입니다'));
    }

    if (trimmedAddress.length > Address.MAX_ADDRESS_LENGTH) {
      return Result.fail(
        new DomainError(`주소는 최대 ${Address.MAX_ADDRESS_LENGTH}자까지 가능합니다`),
      );
    }

    const trimmedDetail = props.addressDetail?.trim() || null;
    if (trimmedDetail && trimmedDetail.length > Address.MAX_DETAIL_LENGTH) {
      return Result.fail(
        new DomainError(`상세 주소는 최대 ${Address.MAX_DETAIL_LENGTH}자까지 가능합니다`),
      );
    }

    const trimmedPostalCode = props.postalCode?.trim() || null;
    if (trimmedPostalCode && !Address.POSTAL_CODE_PATTERN.test(trimmedPostalCode)) {
      return Result.fail(new DomainError('우편번호는 5자리 숫자여야 합니다'));
    }

    return Result.ok(new Address(trimmedAddress, trimmedDetail, trimmedPostalCode));
  }

  /**
   * DB 복원용 (검증 없이 생성)
   */
  static restore(
    address: string,
    addressDetail: string | null,
    postalCode: string | null,
  ): Address {
    return new Address(address, addressDetail, postalCode);
  }

  get address(): string {
    return this._address;
  }

  get addressDetail(): string | null {
    return this._addressDetail;
  }

  get postalCode(): string | null {
    return this._postalCode;
  }

  /**
   * 전체 주소를 문자열로 반환
   */
  getFullAddress(): string {
    const parts = [this._address];
    if (this._addressDetail) {
      parts.push(this._addressDetail);
    }
    return parts.join(' ');
  }

  equals(other: Address): boolean {
    return (
      this._address === other._address &&
      this._addressDetail === other._addressDetail &&
      this._postalCode === other._postalCode
    );
  }

  toString(): string {
    return this.getFullAddress();
  }
}
