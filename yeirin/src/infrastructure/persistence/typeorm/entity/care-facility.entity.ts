import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChildProfileEntity } from './child-profile.entity';
import { GuardianProfileEntity } from './guardian-profile.entity';

/**
 * 양육시설 Entity
 * - 아동복지법에 따른 양육시설
 * - 양육시설 선생님이 소속되는 기관
 * - 양육시설 아동(고아)이 소속되는 기관
 */
@Entity('care_facilities')
export class CareFacilityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 기관명 */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /** 기본 주소 */
  @Column({ type: 'varchar', length: 200 })
  address: string;

  /** 상세 주소 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  addressDetail: string | null;

  /** 우편번호 */
  @Column({ type: 'varchar', length: 10, nullable: true })
  postalCode: string | null;

  /** 대표자명 */
  @Column({ type: 'varchar', length: 50 })
  representativeName: string;

  /** 연락처 */
  @Column({ type: 'varchar', length: 20 })
  phoneNumber: string;

  /** 정원 (수용 가능 아동 수) */
  @Column({ type: 'int' })
  capacity: number;

  /** 설립일 */
  @Column({ type: 'date' })
  establishedDate: Date;

  /** 기관 소개 */
  @Column({ type: 'text', nullable: true })
  introduction: string | null;

  /** 활성화 여부 */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /** 소속 보호자(선생님) 목록 */
  @OneToMany(() => GuardianProfileEntity, (guardian) => guardian.careFacility)
  guardians: GuardianProfileEntity[];

  /** 소속 아동(고아) 목록 */
  @OneToMany(() => ChildProfileEntity, (child) => child.careFacility)
  children: ChildProfileEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
