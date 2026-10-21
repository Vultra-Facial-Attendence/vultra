import { Module } from '@nestjs/common';
import { AccessModule } from '@modules/access/access.module.js';
import { CoreModule } from '@core/core.module.js';

@Module({
  imports: [CoreModule, AccessModule],
})
export class AppModule {}
