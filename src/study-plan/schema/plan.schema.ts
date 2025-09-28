import { z } from 'zod';

export const StudyPlanSchema = z.object({
  meta: z.object({
    subject: z.string(),
    goal: z.string(),
    questDays: z.number().int().positive(),
    cadence: z.enum(['Daily', 'Weekly', 'Fortnightly']),
    startDateEpoch: z.number().int().positive(),
  }),
  items: z.array(
    z.object({
      dayNumber: z.number().int().positive(),
      instruction: z.string(),
      plannedAtEpoch: z.number().int().positive(),
    }),
  ),
  summary: z.string(),
});

export type StudyPlan = z.infer<typeof StudyPlanSchema>;
