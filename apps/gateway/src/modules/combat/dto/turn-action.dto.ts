import { IsString, IsObject, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TargetDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsObject()
  stats?: any;
}

export class TurnActionDto {
  @IsString()
  action_type: string;

  @IsObject()
  action_data: any;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TargetDto)
  targets?: TargetDto[];
}
