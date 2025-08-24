import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ example: 'The Lost Mines of Phandelver' })
  @IsString()
  name: string;

  @ApiProperty({ example: '5e', default: '5e' })
  @IsString()
  @IsOptional()
  ruleset?: string;

  @ApiProperty({ example: { theme: 'dark', style: 'gritty' } })
  @IsObject()
  @IsOptional()
  tone?: any;

  @ApiProperty({ example: 'medium', default: 'medium' })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @ApiProperty({ example: 'fantasy-forest-123' })
  @IsString()
  @IsOptional()
  worldSeed?: string;
}
