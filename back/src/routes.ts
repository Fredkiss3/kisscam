import type { FastifyReply, FastifyRequest } from 'fastify';
import { supabase } from './lib/supabase-server';

export async function createUserIfNotExists(
    req: FastifyRequest<{
        Querystring: { data: string };
        Body: {
            uid: string;
        };
    }>,
    res: FastifyReply
) {
    const { data: user, error } = await supabase
        .from('profile')
        .select()
        .eq('id', req.body.uid);

    if (error) {
        console.error(error);
        return res.code(400).send({
            error: `There was an error while registering, please retry`,
        });
    }

    if (user.length === 0) {
        // create user
        const { error } = await supabase
            .from('profile')
            .insert({ id: req.body.uid });

        if (error) {
            return res.code(400).send({
                error: `There was an error while registering, please retry`,
            });
        }
    }

    return res.code(200).send({
        error: null,
        user,
    });
}
