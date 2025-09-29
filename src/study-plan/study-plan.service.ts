import { Injectable } from '@nestjs/common';
import { generateObject } from 'ai';
import {
  StudyPlanSchema,
  StudyPlanSessionInput,
  StudyPlanResponse,
} from './schema/plan.schema';

@Injectable()
export class StudyPlanService {
  handleSession = async (
    input: StudyPlanSessionInput,
  ): Promise<StudyPlanResponse> => {
    const prompt = input.seed
      ? `You are Professor Wizard Frog. 
    Create a study plan for me on the subject of ${input.seed.subject}. 
    I want to be able to ${input.seed.goal} in the next ${input.seed.questDays}. 
    I can devote 10-30 minutes per ${input.seed.cadence} to this task.
    If my goal is not realistic, suggest a more realistic goal for me.
    If you need clarification on anything, ask before generating the study plan.`
      : input.userMessage;

    const { object, warnings } = await generateObject({
      model: process.env.LLM ?? 'gpt-4o-mini',
      schema: StudyPlanSchema,
      prompt: prompt ?? '',
    });

    return {
      sessionId: input.sessionId,
      stage: 'plan',
      planJson: object,
      warnings,
    };
  };
}
