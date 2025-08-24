import { IsArray, IsString, IsEnum, IsOptional, IsNumber, IsUUID, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ParticipantType } from '../encounter.entity';

export class ParticipantDto {
  @IsString()
  name: string;

  @IsEnum(ParticipantType)
  type: ParticipantType;

  @IsOptional()
  @IsUUID()
  character_id?: string;

  @IsOptional()
  @IsUUID()
  npc_id?: string;

  @IsNumber()
  initiative_modifier: number;

  @IsOptional()
  @IsString()
  initiative_advantage?: 'advantage' | 'disadvantage' | null;

  @IsOptional()
  @IsObject()
  stats?: any;
}

export class InitiativeRollDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  participants: ParticipantDto[];
}
