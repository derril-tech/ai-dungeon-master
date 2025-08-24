import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CombatController } from './combat.controller';
import { CombatService } from './combat.service';
import { Encounter, Initiative, TurnLog } from './encounter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Encounter, Initiative, TurnLog])],
  controllers: [CombatController],
  providers: [CombatService],
  exports: [CombatService],
})
export class CombatModule {}
