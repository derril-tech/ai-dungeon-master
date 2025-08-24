import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, UserRole, CampaignMember, RoleName, CampaignRole } from './role.entity';
import { User } from './user.entity';
import { Campaign } from '../campaigns/campaign.entity';

export interface Permission {
  resource: string;
  action: string;
}

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(CampaignMember)
    private campaignMemberRepository: Repository<CampaignMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
  ) {}

  // Role management
  async createRole(name: string, description: string, permissions: string[]): Promise<Role> {
    const role = this.roleRepository.create({
      name,
      description,
      permissions,
    });
    return await this.roleRepository.save(role);
  }

  async getRoleByName(name: string): Promise<Role | null> {
    return await this.roleRepository.findOne({ where: { name } });
  }

  async getAllRoles(): Promise<Role[]> {
    return await this.roleRepository.find();
  }

  // User role management
  async assignRoleToUser(userId: string, roleId: string, orgId: string, grantedBy: string): Promise<UserRole> {
    const userRole = this.userRoleRepository.create({
      user_id: userId,
      role_id: roleId,
      org_id: orgId,
      granted_by: grantedBy,
    });
    return await this.userRoleRepository.save(userRole);
  }

  async getUserRoles(userId: string, orgId: string): Promise<Role[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { user_id: userId, org_id: orgId },
      relations: ['role'],
    });
    return userRoles.map(ur => ur.role);
  }

  async removeUserRole(userId: string, roleId: string, orgId: string): Promise<void> {
    await this.userRoleRepository.delete({
      user_id: userId,
      role_id: roleId,
      org_id: orgId,
    });
  }

  // Campaign member management
  async addCampaignMember(
    campaignId: string,
    userId: string,
    role: CampaignRole,
    permissions: string[] = []
  ): Promise<CampaignMember> {
    const member = this.campaignMemberRepository.create({
      campaign_id: campaignId,
      user_id: userId,
      role,
      permissions,
    });
    return await this.campaignMemberRepository.save(member);
  }

  async getCampaignMembers(campaignId: string): Promise<CampaignMember[]> {
    return await this.campaignMemberRepository.find({
      where: { campaign_id: campaignId },
      relations: ['user'],
    });
  }

  async getCampaignMember(campaignId: string, userId: string): Promise<CampaignMember | null> {
    return await this.campaignMemberRepository.findOne({
      where: { campaign_id: campaignId, user_id: userId },
    });
  }

  async updateCampaignMemberRole(
    campaignId: string,
    userId: string,
    role: CampaignRole
  ): Promise<CampaignMember> {
    await this.campaignMemberRepository.update(
      { campaign_id: campaignId, user_id: userId },
      { role }
    );
    return await this.getCampaignMember(campaignId, userId);
  }

  async removeCampaignMember(campaignId: string, userId: string): Promise<void> {
    await this.campaignMemberRepository.delete({
      campaign_id: campaignId,
      user_id: userId,
    });
  }

  // Permission checking
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    const userRoles = await this.getUserRoles(userId, user.org_id);
    
    // Check for super admin
    if (userRoles.some(role => role.name === RoleName.SUPER_ADMIN)) {
      return true;
    }

    // Check permissions in user roles
    for (const role of userRoles) {
      if (role.permissions.includes('*') || role.permissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  async hasCampaignPermission(
    userId: string,
    campaignId: string,
    permission: string
  ): Promise<boolean> {
    const member = await this.getCampaignMember(campaignId, userId);
    if (!member) return false;

    // Check campaign-specific permissions
    if (member.permissions.includes('*') || member.permissions.includes(permission)) {
      return true;
    }

    // Check role-based permissions
    const rolePermissions = this.getRolePermissions(member.role);
    return rolePermissions.includes('*') || rolePermissions.includes(permission);
  }

  async hasResourcePermission(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string
  ): Promise<boolean> {
    const permission = `${resourceType}:${action}`;
    
    // Check global permissions first
    if (await this.hasPermission(userId, permission)) {
      return true;
    }

    // Check campaign-specific permissions for campaign-scoped resources
    if (['campaign', 'session', 'character', 'npc', 'map', 'encounter'].includes(resourceType)) {
      const campaignId = await this.getResourceCampaignId(resourceType, resourceId);
      if (campaignId) {
        return await this.hasCampaignPermission(userId, campaignId, permission);
      }
    }

    return false;
  }

  // Helper methods
  private getRolePermissions(role: CampaignRole): string[] {
    const rolePermissionMap = {
      [CampaignRole.OWNER]: [
        'campaign:read', 'campaign:write', 'campaign:delete',
        'session:read', 'session:write',
        'character:read', 'character:write',
        'npc:read', 'npc:write',
        'map:read', 'map:write',
        'encounter:read', 'encounter:write',
        'combat:read', 'combat:write'
      ],
      [CampaignRole.DM]: [
        'campaign:read',
        'session:read', 'session:write',
        'character:read', 'character:write',
        'npc:read', 'npc:write',
        'map:read', 'map:write',
        'encounter:read', 'encounter:write',
        'combat:read', 'combat:write'
      ],
      [CampaignRole.PLAYER]: [
        'campaign:read',
        'session:read',
        'character:read', 'character:write',
        'combat:read'
      ],
      [CampaignRole.OBSERVER]: [
        'campaign:read',
        'session:read',
        'character:read'
      ]
    };

    return rolePermissionMap[role] || [];
  }

  private async getResourceCampaignId(resourceType: string, resourceId: string): Promise<string | null> {
    switch (resourceType) {
      case 'campaign':
        return resourceId;
      case 'session':
        const session = await this.campaignRepository
          .createQueryBuilder('c')
          .innerJoin('sessions', 's', 's.campaign_id = c.id')
          .where('s.id = :sessionId', { sessionId: resourceId })
          .select('c.id')
          .getOne();
        return session?.id || null;
      case 'character':
      case 'npc':
      case 'map':
      case 'encounter':
        const resource = await this.campaignRepository
          .createQueryBuilder('c')
          .innerJoin(`${resourceType}s`, 'r', `r.campaign_id = c.id`)
          .where(`r.id = :resourceId`, { resourceId })
          .select('c.id')
          .getOne();
        return resource?.id || null;
      default:
        return null;
    }
  }

  // Bulk operations
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return [];

    const userRoles = await this.getUserRoles(userId, user.org_id);
    const permissions = new Set<string>();

    // Add global role permissions
    for (const role of userRoles) {
      role.permissions.forEach(permission => permissions.add(permission));
    }

    // Add campaign-specific permissions
    const campaignMemberships = await this.campaignMemberRepository.find({
      where: { user_id: userId },
    });

    for (const membership of campaignMemberships) {
      const rolePermissions = this.getRolePermissions(membership.role);
      rolePermissions.forEach(permission => permissions.add(permission));
      membership.permissions.forEach(permission => permissions.add(permission));
    }

    return Array.from(permissions);
  }

  async getUsersWithPermission(permission: string, orgId: string): Promise<User[]> {
    const userRoles = await this.userRoleRepository
      .createQueryBuilder('ur')
      .innerJoinAndSelect('ur.user', 'user')
      .innerJoinAndSelect('ur.role', 'role')
      .where('ur.org_id = :orgId', { orgId })
      .andWhere('role.permissions @> :permission', { permission: JSON.stringify([permission]) })
      .getMany();

    return userRoles.map(ur => ur.user);
  }
}
