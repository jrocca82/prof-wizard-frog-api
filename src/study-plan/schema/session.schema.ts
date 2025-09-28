import { z } from 'zod';

export const StudyPlanSeedSchema = z.object({
  subject: z.string().min(1),
  goal: z.string().min(1),
  questDays: z.number().int().positive(),
  cadence: z.enum(['Daily', 'Weekly', 'Fortnightly']),
  studyTimeEpoch: z.number().int().positive(),
});

export const StudyPlanSessionSchema = z.object({
  sessionId: z.string().min(1),
  userMessage: z.string().min(1).optional(),
  seed: StudyPlanSeedSchema.optional(),
});

export type StudyPlanSeed = z.infer<typeof StudyPlanSeedSchema>;
export type StudyPlanSessionInput = z.infer<typeof StudyPlanSessionSchema>;
