import { IsString, IsOptional, IsUUID, IsInt, IsEnum, Min, Max } from 'class-validator';
import { MapType, GridType } from '../map.entity';

export class CreateMapDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(MapType)
  type: MapType;

  @IsUUID()
  campaign_id: string;

  @IsInt()
  @Min(100)
  @Max(5000)
  width: number;

  @IsInt()
  @Min(100)
  @Max(5000)
  height: number;

  @IsEnum(GridType)
  grid_type: GridType;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(200)
  grid_size?: number;
}
