import { AuthenticationModule } from '@nestjs/authentication';
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionController } from './controllers/session.controller.js';
import { ManagerSession } from './entities/manager-session.entity.js';
import { Manager } from './entities/manager.entity.js';
import { ManagerSessionProvider } from './providers/manager-session.provider.js';
import { ManagerSessionRepository } from './repositories/manager-session.repository.js';
import { AuthenticationLogService } from './services/authentication-log.service.js';
import { ManagersService } from './services/managers.service.js';

@Module({
  imports: [
    AuthenticationModule.forRoot({
      session: { absoluteTtl: '12h', idleTtl: '2h', touchInterval: '1m' },
    }),
    ThrottlerModule.forRoot([{ ttl: 900_000, limit: 5 }]),
    TypeOrmModule.forFeature([Manager, ManagerSession]),
  ],
  providers: [
    AuthenticationLogService,
    ManagerSessionProvider,
    ManagerSessionRepository,
    ManagersService,
  ],
  controllers: [SessionController],
})
export class AccessModule {}
