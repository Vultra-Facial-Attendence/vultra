import password from '@inquirer/password';
import { NestFactory } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';
import { managerEmail } from '../dto/sign-in.dto.js';
import { ManagersService } from '../services/managers.service.js';

export async function createManager(input: string): Promise<number> {
  const { AppModule } = await import('../../../app.module.js');
  console.log('Validando o e-mail…');
  const email = managerEmail.safeParse(input);
  if (!email.success) {
    console.error(`E-mail inválido: ${input}.`);
    return 1;
  }

  const typed = await password({ message: 'Senha do gestor:' });
  if (typed.length < 15 || typed.length > 128) {
    console.error('A senha precisa ter de 15 a 128 caracteres.');
    return 1;
  }
  const repeated = await password({ message: 'Repita a senha:' });
  if (repeated !== typed) {
    console.error('As senhas não conferem.');
    return 1;
  }

  console.log('Conectando ao banco…');
  const context = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
    abortOnError: false,
  }).catch((error: unknown) => {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`Não foi possível conectar ao banco: ${reason}.`);
  });
  if (!context) {
    return 1;
  }

  try {
    console.log('Criando o gestor…');
    const manager = await context
      .get(ManagersService)
      .create(email.data, typed);
    console.log(`Gestor ${manager.id} criado para ${manager.email}.`);
    return 0;
  } catch (error) {
    if (
      error instanceof QueryFailedError &&
      'code' in error.driverError &&
      error.driverError.code === '23505'
    ) {
      console.error(`Já existe um gestor com o e-mail ${email.data}.`);
      return 1;
    }
    throw error;
  } finally {
    await context.close();
  }
}

if (import.meta.main) {
  await import('dotenv/config');
  process.exitCode = await createManager(process.argv[2] ?? '');
}
