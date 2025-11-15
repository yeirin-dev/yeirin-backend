import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

/**
 * 보호자 프로필 엔티티
 * - 양육시설 교사 또는 부모 역할의 상세 정보
 * - User와 1:1 관계 (GUARDIAN 역할만 보유)
 */
@Entity('guardian_profiles')
export class GuardianProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 연결된 User ID (FK)
   */
  @Column({ type: 'uuid', unique: true })
  userId: string;

  /**
   * User와의 관계 (1:1)
   */
  @OneToOne(() => UserEntity, (user) => user.guardianProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  /**
   * 소속 기관명 (예: OO어린이집, OO양육시설)
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  organizationName: string | null;

  /**
   * 보호자 유형 (TEACHER: 양육시설 교사, PARENT: 부모)
   */
  @Column({
    type: 'enum',
    enum: ['TEACHER', 'PARENT'],
  })
  guardianType: 'TEACHER' | 'PARENT';

  /**
   * 담당 아동 수 (교사의 경우)
   */
  @Column({ type: 'int', nullable: true })
  numberOfChildren: number | null;

  /**
   * 주소
   */
  @Column({ type: 'varchar', length: 200, nullable: true })
  address: string | null;

  /**
   * 상세 주소
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  addressDetail: string | null;

  /**
   * 우편번호
   */
  @Column({ type: 'varchar', length: 10, nullable: true })
  postalCode: string | null;

  /**
   * 비고 (추가 정보)
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
