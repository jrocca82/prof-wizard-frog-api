import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { StudyPlanService } from './study-plan.service';
import {
  CreateQuestSchema,
  CreateQuestInput,
  Quest,
  QuestSchema,
  QuestTask,
  QuestTaskSchema,
  OriginalInstructionSchema,
} from './schema/quest.schema';
import { StudyPlanSeed } from './schema/plan.schema';
import { Database } from '../types/database.types';
import { SUPABASE } from '../supabase/supabase.module';
import { TaskExpansionService } from './task-expansion.service';

@Injectable()
export class QuestService {
  constructor(
    private readonly planService: StudyPlanService,
    private readonly taskExpansionService: TaskExpansionService,
    @Inject(SUPABASE) private readonly supabase: SupabaseClient<Database>,
  ) {}

  async createQuest(seed: StudyPlanSeed & { userId: string | null }) {
    const parsed: CreateQuestInput = CreateQuestSchema.parse({
      userId: seed.userId,
      subject: seed.subject,
      goal: seed.goal,
      questDays: seed.questDays,
      questCadence: seed.cadence,
      studyTimeEpoch: seed.studyTimeEpoch,
      startTime: seed.startTime,
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
        start_time: parsed.startTime,
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
          cadence: seed.questCadence as 'daily' | 'weekly' | 'fortnightly',
          studyTimeEpoch: seed.studyTimeEpoch,
          startTime: seed.startTime,
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
            summary: res.planJson.summary,
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

  async getQuestTasks(questId: string, userId: string): Promise<QuestTask[]> {
    await this.assertQuestOwner(questId, userId);

    const { data, error } = await this.supabase
      .from('quest_tasks')
      .select('*')
      .eq('quest_id', questId)
      .order('day_number', { ascending: true });

    if (error || !data) throw error ?? new Error('No tasks found');
    return data.map((t) => QuestTaskSchema.parse(t));
  }

  private async assertQuestOwner(
    questId: string,
    userId: string,
  ): Promise<void> {
    const { data, error } = await this.supabase
      .from('quests')
      .select('user_id')
      .eq('id', questId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException('Quest not found');
    if (data.user_id !== userId) throw new ForbiddenException();
  }

  async deleteQuest(
    questId: string,
    userId: string,
  ): Promise<{ success: true }> {
    await this.assertQuestOwner(questId, userId);

    const { error: taskErr } = await this.supabase
      .from('quest_tasks')
      .delete()
      .eq('quest_id', questId);

    if (taskErr) {
      throw taskErr;
    }

    const { error: questErr } = await this.supabase
      .from('quests')
      .delete()
      .eq('id', questId)
      .eq('user_id', userId);

    if (questErr) {
      throw questErr;
    }

    return { success: true };
  }

  async expandTask(questId: string, taskId: string, userId: string) {
    await this.assertQuestOwner(questId, userId);

    // 1. Get the base task
    const { data: task, error } = await this.supabase
      .from('quest_tasks')
      .select('id, quest_id, original_instruction')
      .eq('id', taskId)
      .eq('quest_id', questId)
      .single();

    console.log({ task });

    if (error || !task) throw error ?? new Error('Task not found');

    const rawInstruction = OriginalInstructionSchema.parse(
      task.original_instruction,
    );

    // ✅ Now safe: task.original_instruction.instruction is a string
    const expansion = await this.taskExpansionService.expandInstruction(
      rawInstruction.instruction,
    );

    return expansion;
  }
}
