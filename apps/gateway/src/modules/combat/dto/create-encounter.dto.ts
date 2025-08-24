import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';

export class CreateEncounterDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  campaign_id: string;

  @IsOptional()
  @IsUUID()
  session_id?: string;

  @IsOptional()
  @IsObject()
  map_data?: any;

  @IsOptional()
  @IsObject()
  environment?: any;
}
