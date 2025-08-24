import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Campaign } from '../campaigns/campaign.entity';
import { Session } from '../sessions/session.entity';

export enum EncounterStatus {
  PREPARING = 'preparing',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

export enum ParticipantType {
  PLAYER = 'player',
  NPC = 'npc',
  MONSTER = 'monster'
}

@Entity('encounters')
export class Encounter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: EncounterStatus,
    default: EncounterStatus.PREPARING
  })
  status: EncounterStatus;

  @Column({ type: 'uuid' })
  campaign_id: string;

  @Column({ type: 'uuid', nullable: true })
  session_id: string;

  @Column({ type: 'jsonb', nullable: true })
  map_data: any;

  @Column({ type: 'jsonb', nullable: true })
  environment: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Campaign, campaign => campaign.encounters)
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @ManyToOne(() => Session, session => session.encounters)
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @OneToMany(() => Initiative, initiative => initiative.encounter)
  initiative: Initiative[];

  @OneToMany(() => TurnLog, turnLog => turnLog.encounter)
  turn_logs: TurnLog[];
}

@Entity('initiative')
export class Initiative {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  encounter_id: string;

  @Column()
  participant_name: string;

  @Column({
    type: 'enum',
    enum: ParticipantType
  })
  participant_type: ParticipantType;

  @Column({ type: 'uuid', nullable: true })
  character_id: string;

  @Column({ type: 'uuid', nullable: true })
  npc_id: string;

  @Column()
  initiative_roll: number;

  @Column()
  initiative_total: number;

  @Column()
  initiative_modifier: number;

  @Column()
  turn_order: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  stats: any;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Encounter, encounter => encounter.initiative)
  @JoinColumn({ name: 'encounter_id' })
  encounter: Encounter;
}

@Entity('turn_log')
export class TurnLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  encounter_id: string;

  @Column()
  round_number: number;

  @Column()
  turn_number: number;

  @Column()
  actor_name: string;

  @Column()
  action_type: string;

  @Column({ type: 'jsonb' })
  action_data: any;

  @Column({ type: 'jsonb', nullable: true })
  results: any;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @ManyToOne(() => Encounter, encounter => encounter.turn_logs)
  @JoinColumn({ name: 'encounter_id' })
  encounter: Encounter;
}
