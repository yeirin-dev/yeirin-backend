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
 * 지역아동센터 Entity
 * - 아동복지법에 따른 지역아동센터
 * - 지역아동센터 선생님이 소속되는 기관
 * - 지역아동센터 아동(비고아, 부모+센터)이 소속되는 기관
 */
@Entity('community_child_centers')
export class CommunityChildCenterEntity {
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

  /** 운영 시간 (예: "평일 14:00-19:00") */
  @Column({ type: 'varchar', length: 100, nullable: true })
  operatingHours: string | null;

  /** 활성화 여부 */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /** 소속 보호자(선생님) 목록 */
  @OneToMany(() => GuardianProfileEntity, (guardian) => guardian.communityChildCenter)
  guardians: GuardianProfileEntity[];

  /** 소속 아동 목록 */
  @OneToMany(() => ChildProfileEntity, (child) => child.communityChildCenter)
  children: ChildProfileEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
