import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('common_voucher_institutions')
@Index('idx_cvi_district', ['district'])
export class CommonVoucherInstitutionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 기관명 */
  @Column({ type: 'varchar', length: 150 })
  name: string;

  /** 구/군 (ex: 금정구, 동래구, 사상구) */
  @Column({ type: 'varchar', length: 20 })
  district: string;

  /** 기관 주소 */
  @Column({ type: 'varchar', length: 300 })
  address: string;

  /** 연락처 */
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  /** 이메일 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  /** 바우처 유형 (심리치유, 정서발달) */
  @Column({ type: 'varchar', array: true, default: '{}' })
  voucherTypes: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
