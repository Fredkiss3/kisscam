import { FastifyReply, FastifyRequest } from 'fastify';
import { supabase } from './lib/supabase-server';

export async function isAuthed(
    req: FastifyRequest<{
        Headers: { authorization: string };
    }>,
    res: FastifyReply,
    next: (err?: Error | undefined) => void
) {
    const parts = req.headers.authorization.split(' ');
    const jwt = parts[parts.length - 1];

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser(jwt);

    console.log({
        parts,
        jwt,
        user,
        error,
    });

    if (error !== null || user === null) {
        return res.status(401).send({
            error: 'Unauthenticated',
        });
    }

    // set user
    // @ts-ignore
    req.user = user;

    next();
}
