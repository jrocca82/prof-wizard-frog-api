import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StudyPlanModule } from './study-plan/study-plan.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), StudyPlanModule],
})
export class AppModule {}
