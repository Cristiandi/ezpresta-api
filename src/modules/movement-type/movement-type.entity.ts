import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Movement } from '../movement/movement.entity';

@Entity({ name: 'movement_type' })
@Unique('uk_movement_type_uid', ['uid'])
export class MovementType extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Generated('uuid')
  @Column()
  uid: string;

  @Column({ type: 'varchar', length: 10 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // relations

  @OneToMany(() => Movement, (movement) => movement.movementType)
  movements: Movement[];
}
