import { z } from 'zod';

type BaseResponse = {
  sessionId: string;
  warnings?: unknown;
};

type ClarificationResponse = BaseResponse & {
  stage: 'clarification';
  message: string;
};

type PlanResponse = BaseResponse & {
  stage: 'plan';
  planJson: StudyPlan;
};

export type StudyPlanResponse = ClarificationResponse | PlanResponse;

export const StudyPlanSchema = z.object({
  meta: z.object({
    subject: z.string(),
    goal: z.string(),
    questDays: z.number().int().positive(),
    cadence: z.enum(['daily', 'weekly', 'fortnightly']), // normalize to lowercase
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

export const StudyPlanSeedSchema = z.object({
  subject: z.string().min(1),
  goal: z.string().min(1),
  questDays: z.number().int().positive(),
  cadence: z.enum(['daily', 'weekly', 'fortnightly']), // lowercase here too
  studyTimeEpoch: z.number().int().positive(),
});
export type StudyPlanSeed = z.infer<typeof StudyPlanSeedSchema>;

export const StudyPlanSessionSchema = z.object({
  sessionId: z.string().min(1),
  userMessage: z.string().min(1).optional(),
  seed: StudyPlanSeedSchema.optional(),
});
export type StudyPlanSessionInput = z.infer<typeof StudyPlanSessionSchema>;
