// quest.module.ts
import { Module } from '@nestjs/common';
import { QuestService } from './quest.service';
import { StudyPlanService } from './study-plan.service'; // needed inside QuestService
import { SupabaseModule } from '../supabase/supabase.module';
import { QuestController } from './quest.controller';
import { TaskExpansionService } from './task-expansion.service';

@Module({
  imports: [SupabaseModule],
  controllers: [QuestController],
  providers: [QuestService, StudyPlanService, TaskExpansionService],
  exports: [QuestService],
})
export class QuestModule {}
