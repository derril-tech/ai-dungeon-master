import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Campaign } from '../campaigns/campaign.entity';

export enum MapType {
  BATTLEMAP = 'battlemap',
  OVERWORLD = 'overworld',
  DUNGEON = 'dungeon',
  CITY = 'city',
  INTERIOR = 'interior'
}

export enum GridType {
  SQUARE = 'square',
  HEX = 'hex',
  NONE = 'none'
}

@Entity('maps')
export class Map {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: MapType,
    default: MapType.BATTLEMAP
  })
  type: MapType;

  @Column({ type: 'uuid' })
  campaign_id: string;

  @Column({ type: 'int' })
  width: number;

  @Column({ type: 'int' })
  height: number;

  @Column({
    type: 'enum',
    enum: GridType,
    default: GridType.SQUARE
  })
  grid_type: GridType;

  @Column({ type: 'int', default: 50 })
  grid_size: number;

  @Column({ type: 'jsonb', nullable: true })
  grid_data: any;

  @Column({ type: 'jsonb', nullable: true })
  background: any;

  @Column({ type: 'jsonb', nullable: true })
  layers: any;

  @Column({ type: 'jsonb', nullable: true })
  settings: any;

  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Campaign, campaign => campaign.maps)
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @OneToMany(() => Token, token => token.map)
  tokens: Token[];
}

@Entity('tokens')
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  map_id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  character_id: string;

  @Column({ type: 'uuid', nullable: true })
  npc_id: string;

  @Column({ type: 'float' })
  x: number;

  @Column({ type: 'float' })
  y: number;

  @Column({ type: 'int', default: 1 })
  size: number;

  @Column({ type: 'int', nullable: true })
  grid_x: number;

  @Column({ type: 'int', nullable: true })
  grid_y: number;

  @Column({ type: 'jsonb', nullable: true })
  appearance: any;

  @Column({ type: 'jsonb', nullable: true })
  stats: any;

  @Column({ type: 'boolean', default: true })
  is_visible: boolean;

  @Column({ type: 'boolean', default: false })
  is_locked: boolean;

  @Column({ type: 'int', default: 0 })
  layer: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Map, map => map.tokens)
  @JoinColumn({ name: 'map_id' })
  map: Map;
}
