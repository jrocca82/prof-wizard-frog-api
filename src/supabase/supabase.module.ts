// supabase.module.ts
import { Module } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

export const SUPABASE = 'SUPABASE_CLIENT';

@Module({
  providers: [
    {
      provide: SUPABASE,
      useFactory: (): SupabaseClient<Database> =>
        createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SECRET_KEY!,
        ),
    },
  ],
  exports: [SUPABASE],
})
export class SupabaseModule {}
