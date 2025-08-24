import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsObject } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  campaignId: string;

  @ApiProperty({ example: { maxPlayers: 4, sessionLength: 120 } })
  @IsObject()
  @IsOptional()
  settings?: any;
}
