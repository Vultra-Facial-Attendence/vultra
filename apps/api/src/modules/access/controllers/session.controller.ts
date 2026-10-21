import { CurrentUser, Public, SignInService } from '@nestjs/authentication';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  StandardSchemaValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { signInBody, type SignInBody } from '../dto/sign-in.dto.js';
import type { SignedInManager } from '../providers/manager-session.provider.js';
import { ManagersService } from '../services/managers.service.js';

@Controller('session')
export class SessionController {
  constructor(
    private readonly managers: ManagersService,
    private readonly signIn: SignInService,
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post()
  @HttpCode(200)
  async create(
    @Body({ schema: signInBody, pipes: [StandardSchemaValidationPipe] })
    { email, password }: SignInBody,
  ): Promise<SignedInManager> {
    const manager = await this.managers.verifyCredentials(email, password);
    await this.signIn.signIn(manager.id, { method: 'password' });
    return { id: manager.id, email: manager.email };
  }

  @Get()
  show(@CurrentUser() manager: SignedInManager): SignedInManager {
    return manager;
  }

  @Delete()
  @HttpCode(204)
  async remove(): Promise<void> {
    await this.signIn.signOut();
  }
}
