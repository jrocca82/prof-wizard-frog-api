import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { StudyPlanService } from './study-plan.service';
import {
  StudyPlanSessionInput,
  StudyPlanSessionSchema,
} from './schema/session.schema';

@Controller('study-plan')
export class StudyPlanController {
  constructor(private readonly studyPlanService: StudyPlanService) {}

  @Post('session')
  handleSession(@Body() body: unknown) {
    const parsed = StudyPlanSessionSchema.safeParse(body);

    if (!parsed.success) {
      // flatten() gives a cleaner object than error.format()
      throw new BadRequestException(parsed.error.flatten());
    }

    const dto: StudyPlanSessionInput = parsed.data;
    return this.studyPlanService.handleSession(dto);
  }
}
