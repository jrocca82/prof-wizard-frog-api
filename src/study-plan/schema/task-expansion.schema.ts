import { z } from 'zod';

export const ExpandedTaskSchema = z.object({
  checklist: z.array(z.object({ step: z.string() })),
});

export type ExpandedTask = z.infer<typeof ExpandedTaskSchema>;
