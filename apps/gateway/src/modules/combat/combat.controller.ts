import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CombatService } from './combat.service';
import { RollDiceDto } from './dto/roll-dice.dto';
import { ResolveCheckDto } from './dto/resolve-check.dto';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { InitiativeRollDto } from './dto/initiative-roll.dto';
import { TurnActionDto } from './dto/turn-action.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('combat')
@Controller('combat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CombatController {
  constructor(private combatService: CombatService) {}

  @Post('roll')
  @ApiOperation({ summary: 'Roll dice' })
  @ApiResponse({ status: 200, description: 'Dice roll result' })
  async rollDice(@Body() rollDiceDto: RollDiceDto) {
    return this.combatService.rollDice(rollDiceDto);
  }

  @Post('check')
  @ApiOperation({ summary: 'Resolve a skill check or saving throw' })
  @ApiResponse({ status: 200, description: 'Check result' })
  async resolveCheck(@Body() resolveCheckDto: ResolveCheckDto) {
    return this.combatService.resolveCheck(resolveCheckDto);
  }

  @Post('encounters')
  @ApiOperation({ summary: 'Create a new encounter' })
  @ApiResponse({ status: 201, description: 'Encounter created' })
  async createEncounter(@Body() createEncounterDto: CreateEncounterDto) {
    return await this.combatService.createEncounter(createEncounterDto);
  }

  @Get('encounters/:id')
  @ApiOperation({ summary: 'Get encounter details' })
  @ApiResponse({ status: 200, description: 'Encounter details' })
  async getEncounter(@Param('id') id: string) {
    return await this.combatService.getEncounter(id);
  }

  @Post('encounters/:id/initiative')
  @ApiOperation({ summary: 'Roll initiative for encounter participants' })
  @ApiResponse({ status: 200, description: 'Initiative order determined' })
  async rollInitiative(
    @Param('id') encounterId: string,
    @Body() initiativeRollDto: InitiativeRollDto
  ) {
    return await this.combatService.rollInitiative(encounterId, initiativeRollDto);
  }

  @Get('encounters/:id/initiative')
  @ApiOperation({ summary: 'Get current initiative order' })
  @ApiResponse({ status: 200, description: 'Initiative order' })
  async getInitiativeOrder(@Param('id') encounterId: string) {
    return await this.combatService.getInitiativeOrder(encounterId);
  }

  @Post('encounters/:id/turns')
  @ApiOperation({ summary: 'Process a combat turn' })
  @ApiResponse({ status: 200, description: 'Turn processed' })
  async processTurn(
    @Param('id') encounterId: string,
    @Body() body: { actor_name: string; action: TurnActionDto }
  ) {
    return await this.combatService.processTurn(encounterId, body.actor_name, body.action);
  }

  @Get('encounters/:id/turns')
  @ApiOperation({ summary: 'Get turn log history' })
  @ApiResponse({ status: 200, description: 'Turn log history' })
  async getTurnLogs(@Param('id') encounterId: string) {
    return await this.combatService.getTurnLogs(encounterId);
  }
}
