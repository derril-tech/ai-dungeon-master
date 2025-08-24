import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Campaign } from '../campaigns/campaign.entity';

export enum RoleName {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  ORG_MEMBER = 'org_member',
  CAMPAIGN_OWNER = 'campaign_owner',
  CAMPAIGN_DM = 'campaign_dm',
  CAMPAIGN_PLAYER = 'campaign_player',
  CAMPAIGN_OBSERVER = 'campaign_observer'
}

export enum CampaignRole {
  OWNER = 'owner',
  DM = 'dm',
  PLAYER = 'player',
  OBSERVER = 'observer'
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('jsonb', { default: [] })
  permissions: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  role_id: string;

  @Column('uuid')
  org_id: string;

  @Column('uuid', { nullable: true })
  granted_by: string;

  @CreateDateColumn()
  granted_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}

@Entity('campaign_members')
export class CampaignMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  campaign_id: string;

  @Column('uuid')
  user_id: string;

  @Column({
    type: 'enum',
    enum: CampaignRole
  })
  role: CampaignRole;

  @Column('jsonb', { default: [] })
  permissions: string[];

  @CreateDateColumn()
  joined_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
