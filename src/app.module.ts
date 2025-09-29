import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuestModule } from './study-plan/quest.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    QuestModule,
    SupabaseModule,
  ],
})
export class AppModule {}
