import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChildProfileEntity } from './child-profile.entity';

/**
 * 교육복지사협회 학교 Entity
 * - 교육복지사가 배치된 학교
 * - 교육복지사가 관리하는 아동이 소속되는 기관
 */
@Entity('education_welfare_schools')
export class EducationWelfareSchoolEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 학교명 */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /** 구/군 (예: "사하구", "해운대구") - 로그인 시 필터링용 */
  @Column({ type: 'varchar', length: 50 })
  district: string;

  /** 시설 비밀번호 (bcrypt 해시) */
  @Column({ type: 'varchar', length: 255 })
  password: string;

  /** 첫 로그인 비밀번호 변경 여부 */
  @Column({ type: 'boolean', default: false })
  isPasswordChanged: boolean;

  /** 학교 주소 */
  @Column({ type: 'varchar', length: 200 })
  address: string;

  /** 상세 주소 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  addressDetail: string | null;

  /** 우편번호 */
  @Column({ type: 'varchar', length: 10, nullable: true })
  postalCode: string | null;

  /** 교육복지사 성명 */
  @Column({ type: 'varchar', length: 50 })
  welfareWorkerName: string;

  /** 교육복지사 연락처 */
  @Column({ type: 'varchar', length: 20 })
  welfareWorkerPhone: string;

  /** 학교 교육복지실 연락처 */
  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | null;

  /** 이메일 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  /** 바우처 예상 아동 수 */
  @Column({ type: 'int', nullable: true })
  expectedChildCount: number | null;

  /** 연계희망센터명 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  linkedCenterName: string | null;

  /** 연계희망센터 주소 */
  @Column({ type: 'varchar', length: 200, nullable: true })
  linkedCenterAddress: string | null;

  /** 활성화 여부 */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /** 소속 아동 목록 */
  @OneToMany(() => ChildProfileEntity, (child) => child.educationWelfareSchool)
  children: ChildProfileEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
