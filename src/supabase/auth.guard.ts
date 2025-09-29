import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { Request } from 'express';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private supabase: SupabaseClient<Database>;

  constructor() {
    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];
    const result = await this.supabase.auth.getUser(token);

    if (result.error || !result.data.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = result.data.user;

    req.user = {
      id: user.id,
      email: user.email ?? undefined,
    };

    return true;
  }
}
