import { Injectable } from '@nestjs/common';
import { generateObject } from 'ai';
import {
  ExpandedTaskSchema,
  ExpandedTask,
} from './schema/task-expansion.schema';

@Injectable()
export class TaskExpansionService {
  expandInstruction = async (instruction: string): Promise<ExpandedTask> => {
    const prompt = `You are Professor Wizard Frog.
Your job is to take a vague study instruction and make it actionable.
The plan must be completable in **10-30 minutes**.
Return a checklist of 3-7 concrete, specific steps.
Each step should be short, clear, and self-contained.

Instruction: "${instruction}"`;

    const { object, warnings } = await generateObject({
      model: process.env.LLM ?? 'gpt-4o-mini',
      schema: ExpandedTaskSchema,
      prompt,
    });

    if (warnings?.length) {
      console.warn('Expansion warnings:', warnings);
    }

    return object;
  };
}
