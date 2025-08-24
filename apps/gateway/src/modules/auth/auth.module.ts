import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { User } from './user.entity';
import { Role, UserRole, CampaignMember } from './role.entity';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';
import { PermissionGuard } from './permission.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserRole, CampaignMember]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY || 'your-secret-key',
      signOptions: { expiresIn: '30m' },
    }),
  ],
  controllers: [AuthController, RbacController],
  providers: [AuthService, LocalStrategy, JwtStrategy, RbacService, PermissionGuard],
  exports: [AuthService, RbacService, PermissionGuard],
})
export class AuthModule {}
