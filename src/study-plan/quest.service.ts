import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { StudyPlanService } from './study-plan.service';
import {
  CreateQuestSchema,
  CreateQuestInput,
  Quest,
  QuestSchema,
  QuestTask,
  QuestTaskSchema,
} from './schema/quest.schema';
import { StudyPlanSeed } from './schema/plan.schema';
import { Database } from '../types/database.types';
import { SUPABASE } from '../supabase/supabase.module';

@Injectable()
export class QuestService {
  constructor(
    private readonly planService: StudyPlanService,
    @Inject(SUPABASE) private readonly supabase: SupabaseClient<Database>,
  ) {}

  async createQuest(seed: StudyPlanSeed & { userId: string | null }) {
    const parsed: CreateQuestInput = CreateQuestSchema.parse({
      userId: seed.userId,
      subject: seed.subject,
      goal: seed.goal,
      questDays: seed.questDays,
      questCadence: seed.cadence, // ✅ no toLowerCase, already lowercase in schema
      studyTimeEpoch: seed.studyTimeEpoch,
    });

    const { data, error } = await this.supabase
      .from('quests')
      .insert({
        user_id: parsed.userId,
        subject: parsed.subject,
        goal: parsed.goal,
        quest_days: parsed.questDays,
        quest_cadence: parsed.questCadence,
        preferred_study_time: parsed.studyTimeEpoch,
        generation_status: 'pending',
      })
      .select('id')
      .single();

    if (error || !data) {
      throw error ?? new Error('Failed to insert quest');
    }
    const questId = data.id;

    // Fire async generation (don’t block response)
    void this.generateAndStore(questId, parsed);

    return { questId, status: 'pending' as const };
  }

  private async generateAndStore(questId: string, seed: CreateQuestInput) {
    try {
      const res = await this.planService.handleSession({
        sessionId: questId,
        seed: {
          subject: seed.subject,
          goal: seed.goal,
          questDays: seed.questDays,
          cadence: seed.questCadence as 'daily' | 'weekly' | 'fortnightly', // ✅ consistent types
          studyTimeEpoch: seed.studyTimeEpoch,
        },
      });

      if (res.stage === 'plan') {
        // Insert quest_tasks
        const tasks = res.planJson.items.map((t) => ({
          quest_id: questId,
          day_number: t.dayNumber,
          original_instruction: t,
        }));

        const { error: taskErr } = await this.supabase
          .from('quest_tasks')
          .insert(tasks);
        if (taskErr) throw taskErr;

        await this.supabase
          .from('quests')
          .update({
            generation_status: 'ready',
          })
          .eq('id', questId);
      } else if (res.stage === 'clarification') {
        await this.supabase
          .from('quests')
          .update({
            generation_status: 'clarification',
          })
          .eq('id', questId);
      }
    } catch (e) {
      console.error(e);
      await this.supabase
        .from('quests')
        .update({ generation_status: 'error' })
        .eq('id', questId);
    }
  }

  async getUserQuests(userId: string): Promise<Quest[]> {
    const { data, error } = await this.supabase
      .from('quests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) throw error ?? new Error('No quests found');
    return data.map((q) => QuestSchema.parse(q));
  }

  async getQuest(questId: string, userId: string): Promise<Quest> {
    const { data, error } = await this.supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw error ?? new Error('Quest not found');
    return QuestSchema.parse(data);
  }

  async getQuestTasks(questId: string): Promise<QuestTask[]> {
    const { data, error } = await this.supabase
      .from('quest_tasks')
      .select('*')
      .eq('quest_id', questId)
      .order('day_number', { ascending: true });

    if (error || !data) throw error ?? new Error('No tasks found');
    return data.map((t) => QuestTaskSchema.parse(t));
  }
}
