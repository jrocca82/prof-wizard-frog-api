import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  BadRequestException,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { QuestService } from './quest.service';
import { StudyPlanSeedSchema, StudyPlanSeed } from './schema/plan.schema';
import { SupabaseAuthGuard } from 'src/supabase/auth.guard';

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

@Controller('quests')
@UseGuards(SupabaseAuthGuard)
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  @Post()
  async create(@Body() body: unknown, @Req() req: AuthRequest) {
    // ✅ Validate with Zod
    const parsed = StudyPlanSeedSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const seed: StudyPlanSeed & { userId: string | null } = {
      ...parsed.data,
      userId: req.user?.id ?? null,
    };

    return this.questService.createQuest(seed);
  }

  @Get(':id')
  async getQuest(@Param('id') id: string, @Req() req: AuthRequest) {
    if (!req.user?.id) {
      throw new UnauthorizedException();
    }
    return this.questService.getQuest(id, req.user.id);
  }

  @Get()
  async listQuests(@Req() req: AuthRequest) {
    if (!req.user?.id) {
      throw new UnauthorizedException();
    }
    return this.questService.getUserQuests(req.user.id);
  }

  @Get(':id/tasks')
  async getTasks(@Param('id') id: string) {
    return this.questService.getQuestTasks(id);
  }
}
