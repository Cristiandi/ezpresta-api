import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Loan } from '../loan/loan.entity';
import { MovementType } from '../movement-type/movement-type.entity';

@Entity({ name: 'movement' })
@Unique('uk_movement_uid', ['uid'])
export class Movement extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Generated('uuid')
  @Column()
  uid: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  amount: number;

  @Column({ type: 'timestamptz' })
  at: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // relations

  @ManyToOne(() => Loan, (loan) => loan.movements, { nullable: false })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;

  @ManyToOne(() => MovementType, (movementType) => movementType.movements, {
    nullable: false,
  })
  @JoinColumn({ name: 'movement_type_id' })
  movementType: MovementType;
}
