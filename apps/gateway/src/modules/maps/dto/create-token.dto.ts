import { IsString, IsOptional, IsUUID, IsNumber, IsInt, Min, Max } from 'class-validator';

export class CreateTokenDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  map_id: string;

  @IsOptional()
  @IsUUID()
  character_id?: string;

  @IsOptional()
  @IsUUID()
  npc_id?: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  size?: number;

  @IsOptional()
  @IsInt()
  grid_x?: number;

  @IsOptional()
  @IsInt()
  grid_y?: number;

  @IsOptional()
  appearance?: any;

  @IsOptional()
  stats?: any;
}
