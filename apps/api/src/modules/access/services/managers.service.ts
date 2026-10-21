import { PasswordHasher } from '@nestjs/authentication';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Manager } from '../entities/manager.entity.js';

@Injectable()
export class ManagersService {
  constructor(
    @InjectRepository(Manager) private readonly managers: Repository<Manager>,
    private readonly hasher: PasswordHasher,
  ) {}

  async verifyCredentials(email: string, password: string): Promise<Manager> {
    const manager = await this.managers.findOneBy({ email });
    const verified = await this.hasher.verify(password, manager?.passwordHash);
    if (!manager || !verified) {
      throw new UnauthorizedException('Invalid e-mail or password', {
        errorCode: 'invalid_credentials',
      });
    }
    if (this.hasher.needsRehash(manager.passwordHash)) {
      await this.managers.update(manager.id, {
        passwordHash: await this.hasher.hash(password),
      });
    }
    return manager;
  }

  async create(email: string, password: string): Promise<Manager> {
    return this.managers.save(
      this.managers.create({
        email,
        passwordHash: await this.hasher.hash(password),
      }),
    );
  }
}
