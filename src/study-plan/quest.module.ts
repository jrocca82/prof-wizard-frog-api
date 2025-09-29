// quest.module.ts
import { Module } from '@nestjs/common';
import { QuestService } from './quest.service';
import { StudyPlanService } from './study-plan.service'; // needed inside QuestService
import { SupabaseModule } from '../supabase/supabase.module';
import { QuestController } from './quest.controller';

@Module({
  imports: [SupabaseModule],
  controllers: [QuestController],
  providers: [QuestService, StudyPlanService],
  exports: [QuestService],
})
export class QuestModule {}
