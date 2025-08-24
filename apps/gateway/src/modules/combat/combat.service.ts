import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RollDiceDto } from './dto/roll-dice.dto';
import { ResolveCheckDto } from './dto/resolve-check.dto';
import { Encounter, Initiative, TurnLog, EncounterStatus } from './encounter.entity';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { InitiativeRollDto } from './dto/initiative-roll.dto';
import { TurnActionDto } from './dto/turn-action.dto';

@Injectable()
export class CombatService {
  constructor(
    @InjectRepository(Encounter)
    private encounterRepository: Repository<Encounter>,
    @InjectRepository(Initiative)
    private initiativeRepository: Repository<Initiative>,
    @InjectRepository(TurnLog)
    private turnLogRepository: Repository<TurnLog>,
  ) {}
  async rollDice(rollDiceDto: RollDiceDto) {
    // In a real implementation, this would call the workers service
    // For now, we'll simulate the response
    
    const { expression, advantage = 'normal' } = rollDiceDto;
    
    // Simulate dice roll
    const rolls = this.simulateDiceRoll(expression);
    const total = rolls.reduce((sum, roll) => sum + roll, 0);
    
    return {
      expression,
      advantage,
      rolls,
      total,
      raw_expression: expression
    };
  }

  async resolveCheck(resolveCheckDto: ResolveCheckDto) {
    const { expression, dc, advantage = 'normal', modifiers = {} } = resolveCheckDto;
    
    // Simulate dice roll
    const rolls = this.simulateDiceRoll(expression);
    let total = rolls.reduce((sum, roll) => sum + roll, 0);
    
    // Apply modifiers
    for (const [modifierName, modifierValue] of Object.entries(modifiers)) {
      total += modifierValue;
    }
    
    // Determine success
    const success = total >= dc;
    const margin = total - dc;
    
    // Determine degree of success/failure
    let degree = 'failure';
    if (total >= dc + 10) {
      degree = 'critical_success';
    } else if (total <= dc - 10) {
      degree = 'critical_failure';
    } else if (success) {
      degree = 'success';
    }
    
    return {
      expression,
      advantage,
      rolls,
      total,
      dc,
      success,
      margin,
      degree,
      modifiers
    };
  }

  private simulateDiceRoll(expression: string): number[] {
    // Simple dice expression parser for simulation
    const diceMatch = expression.match(/(\d+)d(\d+)/);
    if (!diceMatch) {
      return [Math.floor(Math.random() * 20) + 1]; // Default to d20
    }
    
    const [, count, sides] = diceMatch;
    const numDice = parseInt(count);
    const numSides = parseInt(sides);
    
    const rolls: number[] = [];
    for (let i = 0; i < numDice; i++) {
      rolls.push(Math.floor(Math.random() * numSides) + 1);
    }
    
    return rolls;
  }

  async createEncounter(createEncounterDto: CreateEncounterDto): Promise<Encounter> {
    const encounter = this.encounterRepository.create(createEncounterDto);
    return await this.encounterRepository.save(encounter);
  }

  async getEncounter(id: string): Promise<Encounter> {
    return await this.encounterRepository.findOne({
      where: { id },
      relations: ['initiative', 'turn_logs']
    });
  }

  async rollInitiative(encounterId: string, initiativeRollDto: InitiativeRollDto) {
    // TODO: Call workers service for initiative rolling
    const participants = initiativeRollDto.participants.map((p, index) => ({
      ...p,
      initiative_roll: Math.floor(Math.random() * 20) + 1,
      initiative_total: Math.floor(Math.random() * 20) + 1 + p.initiative_modifier,
      turn_order: index + 1
    }));

    // Sort by initiative total (highest first)
    participants.sort((a, b) => b.initiative_total - a.initiative_total);

    // Save initiative to database
    const initiativeEntries = participants.map((participant, index) => {
      return this.initiativeRepository.create({
        encounter_id: encounterId,
        participant_name: participant.name,
        participant_type: participant.type,
        character_id: participant.character_id,
        npc_id: participant.npc_id,
        initiative_roll: participant.initiative_roll,
        initiative_total: participant.initiative_total,
        initiative_modifier: participant.initiative_modifier,
        turn_order: index + 1,
        stats: participant.stats
      });
    });

    await this.initiativeRepository.save(initiativeEntries);

    // Update encounter status to active
    await this.encounterRepository.update(encounterId, { status: EncounterStatus.ACTIVE });

    return participants;
  }

  async processTurn(encounterId: string, actorName: string, turnActionDto: TurnActionDto) {
    // TODO: Call workers service for turn processing
    const turnResult = {
      actor: actorName,
      action: turnActionDto.action_type,
      results: [{
        type: 'action',
        description: `Processed ${turnActionDto.action_type} action`
      }]
    };

    // Save turn log
    const turnLog = this.turnLogRepository.create({
      encounter_id: encounterId,
      round_number: 1, // TODO: Calculate current round
      turn_number: 1, // TODO: Calculate current turn
      actor_name: actorName,
      action_type: turnActionDto.action_type,
      action_data: turnActionDto.action_data,
      results: turnResult.results
    });

    await this.turnLogRepository.save(turnLog);

    return turnResult;
  }

  async getInitiativeOrder(encounterId: string): Promise<Initiative[]> {
    return await this.initiativeRepository.find({
      where: { encounter_id: encounterId, is_active: true },
      order: { turn_order: 'ASC' }
    });
  }

  async getTurnLogs(encounterId: string): Promise<TurnLog[]> {
    return await this.turnLogRepository.find({
      where: { encounter_id: encounterId },
      order: { timestamp: 'DESC' }
    });
  }
}
