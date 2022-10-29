import type { User } from '@supabase/supabase-js';

import type fastify from 'fastify';
declare module 'fastify' {
    export interface FastifyRequest {
        user?: User;
    }
}
