import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from './rbac.service';

export interface PermissionMetadata {
  resource: string;
  action: string;
  resourceIdParam?: string;
}

export const PERMISSION_KEY = 'permission';

export const RequirePermission = (permission: PermissionMetadata) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(PERMISSION_KEY, permission, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<PermissionMetadata>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permission) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const { resource, action, resourceIdParam } = permission;
    let resourceId = resourceIdParam ? request.params[resourceIdParam] : null;

    // If no specific resource ID is required, check general permission
    if (!resourceId) {
      const hasPermission = await this.rbacService.hasPermission(
        user.id,
        `${resource}:${action}`
      );
      
      if (!hasPermission) {
        throw new ForbiddenException(`Insufficient permissions: ${resource}:${action}`);
      }
      
      return true;
    }

    // Check resource-specific permission
    const hasResourcePermission = await this.rbacService.hasResourcePermission(
      user.id,
      resource,
      resourceId,
      action
    );

    if (!hasResourcePermission) {
      throw new ForbiddenException(
        `Insufficient permissions: ${resource}:${action} on resource ${resourceId}`
      );
    }

    return true;
  }
}
