import { z } from 'zod';

export const CreateQuestSchema = z.object({
  userId: z.string().uuid().nullable(),
  subject: z.string().min(1),
  goal: z.string().min(1),
  questDays: z.number().int().positive(),
  questCadence: z.enum(['daily', 'weekly', 'fortnightly', 'custom']),
  studyTimeEpoch: z.number().int().positive(),
  startTime: z.number().int().positive(),
});

export type CreateQuestInput = z.infer<typeof CreateQuestSchema>;

export const QuestSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  subject: z.string(),
  goal: z.string().nullable(),
  quest_days: z.number(),
  quest_cadence: z.enum(['daily', 'weekly', 'fortnightly', 'custom']),
  preferred_study_time: z.number().nullable(),
  status: z.enum(['active', 'completed', 'abandoned']),
  generation_status: z.enum(['pending', 'ready', 'clarification', 'error']),
  generation_warnings: z.unknown().nullable(), // safer than string
  created_at: z.string(),
  summary: z.string().nullable(),
});
export type Quest = z.infer<typeof QuestSchema>;

export const OriginalInstructionSchema = z.object({
  dayNumber: z.number(),
  instruction: z.string(),
  plannedAtEpoch: z.number(),
});

export type OriginalInstructionSchema = z.infer<
  typeof OriginalInstructionSchema
>;

export const QuestTaskSchema = z.object({
  id: z.string().uuid(),
  quest_id: z.string().uuid().nullable(),
  day_number: z.number(),
  original_instruction: OriginalInstructionSchema,
  is_revealed: z.boolean().nullable(),
  revealed_at: z.string().nullable(),
  is_complete: z.boolean().nullable(),
  completed_at: z.string().nullable(),
});

export type QuestTask = z.infer<typeof QuestTaskSchema>;
