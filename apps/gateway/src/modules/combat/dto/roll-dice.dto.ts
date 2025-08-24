import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class RollDiceDto {
  @ApiProperty({ example: '1d20 + 5', description: 'Dice expression to roll' })
  @IsString()
  expression: string;

  @ApiProperty({ 
    example: 'normal', 
    enum: ['normal', 'advantage', 'disadvantage'],
    description: 'Advantage/disadvantage for d20 rolls',
    required: false 
  })
  @IsOptional()
  @IsIn(['normal', 'advantage', 'disadvantage'])
  advantage?: string;
}
