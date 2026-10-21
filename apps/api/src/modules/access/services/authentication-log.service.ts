import { AuthenticationEvents } from '@nestjs/authentication';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AuthenticationLogService implements OnModuleInit {
  constructor(
    private readonly events: AuthenticationEvents,
    private readonly logger: PinoLogger,
  ) {}

  onModuleInit() {
    this.events.events$.subscribe((event) => {
      if (event.type === 'sign-in') {
        this.logger.info({ managerId: event.userId }, 'manager signed in');
      }
      if (event.type === 'sign-out') {
        this.logger.info({ managerId: event.userId }, 'manager signed out');
      }
    });
  }
}
