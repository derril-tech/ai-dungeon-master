import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId: string;

  @Column()
  name: string;

  @Column({ default: '5e' })
  ruleset: string;

  @Column({ type: 'jsonb', default: {} })
  tone: any;

  @Column({ default: 'medium' })
  difficulty: string;

  @Column({ name: 'world_seed', nullable: true })
  worldSeed: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
