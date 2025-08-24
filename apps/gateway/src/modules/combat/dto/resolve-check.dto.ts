import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsIn, IsObject } from 'class-validator';

export class ResolveCheckDto {
  @ApiProperty({ example: '1d20 + 5', description: 'Dice expression for the check' })
  @IsString()
  expression: string;

  @ApiProperty({ example: 15, description: 'Difficulty class' })
  @IsNumber()
  dc: number;

  @ApiProperty({ 
    example: 'normal', 
    enum: ['normal', 'advantage', 'disadvantage'],
    description: 'Advantage/disadvantage for the check',
    required: false 
  })
  @IsOptional()
  @IsIn(['normal', 'advantage', 'disadvantage'])
  advantage?: string;

  @ApiProperty({ 
    example: { 'circumstance': 2, 'inspiration': 1 },
    description: 'Additional modifiers to apply',
    required: false 
  })
  @IsOptional()
  @IsObject()
  modifiers?: Record<string, number>;
}
