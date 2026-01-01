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

  /** 구/군 (예: "영도구", "북구") - 로그인 시 필터링용 */
  @Column({ type: 'varchar', length: 50 })
  district: string;

  /** 권역 (예: "원도심권", "서부산권") */
  @Column({ type: 'varchar', length: 50, nullable: true })
  region: string | null;

  /** 시설 비밀번호 (bcrypt 해시) */
  @Column({ type: 'varchar', length: 255 })
  password: string;

  /** 첫 로그인 비밀번호 변경 여부 */
  @Column({ type: 'boolean', default: false })
  isPasswordChanged: boolean;

  /** 기본 주소 */
  @Column({ type: 'varchar', length: 200 })
  address: string;

  /** 상세 주소 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  addressDetail: string | null;

  /** 우편번호 */
  @Column({ type: 'varchar', length: 10, nullable: true })
  postalCode: string | null;

  /** 센터장명 (대표자) */
  @Column({ type: 'varchar', length: 50 })
  directorName: string;

  /** 담당자명 */
  @Column({ type: 'varchar', length: 50, nullable: true })
  managerName: string | null;

  /** 담당자 연락처 */
  @Column({ type: 'varchar', length: 20, nullable: true })
  managerPhone: string | null;

  /** 기관 대표번호 */
  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | null;

  /** 기관 이메일 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  /** 바우처 예상 아동 수 */
  @Column({ type: 'int', nullable: true })
  expectedChildCount: number | null;

  /** 정원 (수용 가능 아동 수) */
  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  /** 설립일 */
  @Column({ type: 'date', nullable: true })
  establishedDate: Date | null;

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
