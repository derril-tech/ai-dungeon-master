import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionGuard, RequirePermission } from './permission.guard';
import { RbacService } from './rbac.service';
import { RoleName, CampaignRole } from './role.entity';

// DTOs
export class CreateRoleDto {
  name: string;
  description?: string;
  permissions: string[];
}

export class AssignRoleDto {
  userId: string;
  roleId: string;
  orgId: string;
}

export class AddCampaignMemberDto {
  userId: string;
  role: CampaignRole;
  permissions?: string[];
}

export class UpdateCampaignMemberDto {
  role: CampaignRole;
  permissions?: string[];
}

@ApiTags('RBAC')
@Controller('rbac')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // Role management
  @Get('roles')
  @RequirePermission({ resource: 'role', action: 'read' })
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async getAllRoles() {
    return await this.rbacService.getAllRoles();
  }

  @Post('roles')
  @RequirePermission({ resource: 'role', action: 'write' })
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return await this.rbacService.createRole(
      createRoleDto.name,
      createRoleDto.description,
      createRoleDto.permissions
    );
  }

  // User role management
  @Post('users/:userId/roles')
  @RequirePermission({ resource: 'user', action: 'write' })
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiResponse({ status: 201, description: 'Role assigned successfully' })
  async assignRoleToUser(
    @Param('userId') userId: string,
    @Body() assignRoleDto: AssignRoleDto
  ) {
    return await this.rbacService.assignRoleToUser(
      userId,
      assignRoleDto.roleId,
      assignRoleDto.orgId,
      assignRoleDto.userId // granted by
    );
  }

  @Get('users/:userId/roles')
  @RequirePermission({ resource: 'user', action: 'read' })
  @ApiOperation({ summary: 'Get user roles' })
  @ApiResponse({ status: 200, description: 'User roles retrieved successfully' })
  async getUserRoles(@Param('userId') userId: string) {
    // TODO: Get orgId from request context
    const orgId = 'demo-org-id'; // This should come from the authenticated user
    return await this.rbacService.getUserRoles(userId, orgId);
  }

  @Delete('users/:userId/roles/:roleId')
  @RequirePermission({ resource: 'user', action: 'write' })
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  async removeUserRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string
  ) {
    // TODO: Get orgId from request context
    const orgId = 'demo-org-id';
    await this.rbacService.removeUserRole(userId, roleId, orgId);
    return { message: 'Role removed successfully' };
  }

  // Campaign member management
  @Post('campaigns/:campaignId/members')
  @RequirePermission({ resource: 'campaign', action: 'write', resourceIdParam: 'campaignId' })
  @ApiOperation({ summary: 'Add member to campaign' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  async addCampaignMember(
    @Param('campaignId') campaignId: string,
    @Body() addMemberDto: AddCampaignMemberDto
  ) {
    return await this.rbacService.addCampaignMember(
      campaignId,
      addMemberDto.userId,
      addMemberDto.role,
      addMemberDto.permissions
    );
  }

  @Get('campaigns/:campaignId/members')
  @RequirePermission({ resource: 'campaign', action: 'read', resourceIdParam: 'campaignId' })
  @ApiOperation({ summary: 'Get campaign members' })
  @ApiResponse({ status: 200, description: 'Campaign members retrieved successfully' })
  async getCampaignMembers(@Param('campaignId') campaignId: string) {
    return await this.rbacService.getCampaignMembers(campaignId);
  }

  @Put('campaigns/:campaignId/members/:userId')
  @RequirePermission({ resource: 'campaign', action: 'write', resourceIdParam: 'campaignId' })
  @ApiOperation({ summary: 'Update campaign member role' })
  @ApiResponse({ status: 200, description: 'Member role updated successfully' })
  async updateCampaignMember(
    @Param('campaignId') campaignId: string,
    @Param('userId') userId: string,
    @Body() updateMemberDto: UpdateCampaignMemberDto
  ) {
    return await this.rbacService.updateCampaignMemberRole(
      campaignId,
      userId,
      updateMemberDto.role
    );
  }

  @Delete('campaigns/:campaignId/members/:userId')
  @RequirePermission({ resource: 'campaign', action: 'write', resourceIdParam: 'campaignId' })
  @ApiOperation({ summary: 'Remove member from campaign' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  async removeCampaignMember(
    @Param('campaignId') campaignId: string,
    @Param('userId') userId: string
  ) {
    await this.rbacService.removeCampaignMember(campaignId, userId);
    return { message: 'Member removed successfully' };
  }

  // Permission checking
  @Get('users/:userId/permissions')
  @RequirePermission({ resource: 'user', action: 'read' })
  @ApiOperation({ summary: 'Get user permissions' })
  @ApiResponse({ status: 200, description: 'User permissions retrieved successfully' })
  async getUserPermissions(@Param('userId') userId: string) {
    return await this.rbacService.getUserPermissions(userId);
  }

  @Post('check-permission')
  @ApiOperation({ summary: 'Check if user has permission' })
  @ApiResponse({ status: 200, description: 'Permission check result' })
  async checkPermission(
    @Body() body: { userId: string; permission: string }
  ) {
    const hasPermission = await this.rbacService.hasPermission(
      body.userId,
      body.permission
    );
    return { hasPermission };
  }

  @Post('check-campaign-permission')
  @ApiOperation({ summary: 'Check if user has campaign permission' })
  @ApiResponse({ status: 200, description: 'Campaign permission check result' })
  async checkCampaignPermission(
    @Body() body: { userId: string; campaignId: string; permission: string }
  ) {
    const hasPermission = await this.rbacService.hasCampaignPermission(
      body.userId,
      body.campaignId,
      body.permission
    );
    return { hasPermission };
  }
}
