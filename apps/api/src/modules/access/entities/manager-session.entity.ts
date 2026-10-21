import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Manager } from './manager.entity.js';

@Entity('manager_sessions')
export class ManagerSession {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Index()
  @Column({ name: 'manager_id', type: 'uuid' })
  managerId: string;

  @ManyToOne(() => Manager, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'manager_id' })
  manager: Manager;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'last_active_at', type: 'timestamptz' })
  lastActiveAt: Date;
}
