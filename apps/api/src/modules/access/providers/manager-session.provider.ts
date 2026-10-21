import {
  AuthenticationRegistry,
  SessionCookieProvider,
  type SessionRecord,
} from '@nestjs/authentication';
import { Injectable } from '@nestjs/common';
import type { Manager } from '../entities/manager.entity.js';

export type SignedInManager = Pick<Manager, 'id' | 'email'>;

declare module '@nestjs/authentication' {
  interface AuthenticationTypes {
    user: SignedInManager;
    sessionExtra: { user: SignedInManager };
  }
}

@Injectable()
export class ManagerSessionProvider extends SessionCookieProvider<SignedInManager> {
  constructor(registry: AuthenticationRegistry) {
    super();
    registry.registerProvider(this);
  }

  protected validate(session: SessionRecord) {
    return session.extra?.user;
  }
}
