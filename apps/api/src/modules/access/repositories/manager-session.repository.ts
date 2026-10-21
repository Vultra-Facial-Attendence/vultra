import {
  AuthenticationStorage,
  type SessionRecord,
  type SessionStore,
} from '@nestjs/authentication';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { ManagerSession } from '../entities/manager-session.entity.js';

@Injectable()
export class ManagerSessionRepository implements SessionStore {
  constructor(
    @InjectRepository(ManagerSession)
    private readonly sessions: Repository<ManagerSession>,
    storage: AuthenticationStorage,
  ) {
    storage.registerSource({ sessions: this });
  }

  async getSession(id: string): Promise<SessionRecord | undefined> {
    const session = await this.sessions.findOne({
      where: { id },
      relations: { manager: true },
      select: {
        id: true,
        managerId: true,
        createdAt: true,
        expiresAt: true,
        lastActiveAt: true,
        manager: { id: true, email: true },
      },
    });
    if (!session) {
      return undefined;
    }
    const { manager, ...record } = session;
    return { ...toRecord(record), extra: { user: manager } };
  }

  async createSession(record: SessionRecord): Promise<void> {
    await this.sessions.delete({
      expiresAt: LessThanOrEqual(record.createdAt),
    });
    await this.sessions.insert({
      id: record.id,
      managerId: record.userId,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      lastActiveAt: record.lastActiveAt,
    });
  }

  async touchSession(id: string, lastActiveAt: Date): Promise<void> {
    await this.sessions.update(
      { id, lastActiveAt: LessThan(lastActiveAt) },
      { lastActiveAt },
    );
  }

  async deleteSession(id: string): Promise<boolean> {
    const { affected } = await this.sessions.delete({ id });
    return affected === 1;
  }

  async listUserSessions(userId: string): Promise<SessionRecord[]> {
    const sessions = await this.sessions.findBy({ managerId: userId });
    return sessions.map(toRecord);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await this.sessions.delete({ managerId: userId });
  }
}

function toRecord(session: Omit<ManagerSession, 'manager'>): SessionRecord {
  return {
    id: session.id,
    userId: session.managerId,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    lastActiveAt: session.lastActiveAt,
  };
}
