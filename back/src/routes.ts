import { stripe } from './lib/stripe-client';
import { supabase } from './lib/supabase-server';
import { checkIfUserIsSubscribed } from './lib/functions';

import type Stripe from 'stripe';
import type { FastifyReply, FastifyRequest } from 'fastify';

export async function createUserIfNotExists(
    req: FastifyRequest<{
        Headers: { authorization: string };
    }>,
    res: FastifyReply
) {
    // @ts-ignore
    const user = req.user;

    if (!user) {
        return res.code(403).send({
            error: `This user is not registered, please retry`,
        });
    }

    const { data: profile, error } = await supabase
        .from('profile')
        .select()
        .eq('id', user.id);

    if (error) {
        console.error(error);
        return res.code(400).send({
            error: `There was an error while registering, please retry`,
        });
    }

    if (profile.length === 0) {
        // create stripe customer user
        const customer = await stripe.customers.create({
            email: user.email,
        });

        // then create supabse profile
        const { error } = await supabase
            .from('profile')
            .insert({ id: user.id, stripe_customer_id: customer.id });

        if (error) {
            return res.code(400).send({
                error: `There was an error while registering, please retry`,
            });
        }
    }

    // 1 hour connected
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + 3600);
    return res.code(200).send({
        user,
        ...profile,
    });
}

export async function stripeWebHookHandler(
    req: FastifyRequest<{
        Querystring: { data: string };
        Body: { raw: string | Buffer };
        Headers: {
            'stripe-signature': string;
        };
    }>,
    res: FastifyReply
) {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body.raw,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err) {
        return res.status(400).send({
            success: false,
            error: `Webhook Error: ${(err as Error).message}`,
        });
    }

    switch (event.type) {
        case 'invoice.paid': {
            // start subscription
            const start = new Date(
                (event.data.object as any).period_start * 1000
            );
            const end = new Date((event.data.object as any).period_end * 1000);

            const { error } = await supabase
                .from('profile')
                .update({
                    subscribed_at: start.toISOString(),
                    subscription_end_at: end.toISOString(),
                })
                .eq('stripe_customer_id', (event.data.object as any).customer)
                .select();

            if (error) {
                return res.status(400).send({
                    success: false,
                    error: `Webhook Error: ${error.toString()}`,
                });
            }
            break;
        }
        case 'customer.subscription.deleted': {
            // end subscription
            const { error } = await supabase
                .from('profile')
                .update({
                    subscribed_at: null,
                    subscription_end_at: null,
                })
                .eq('stripe_customer_id', (event.data.object as any).customer)
                .select();

            if (error) {
                return res.status(400).send({
                    success: false,
                    error: `Webhook Error: ${error.toString()}`,
                });
            }
            return;
        }
        case 'customer.subscription.updated': {
            const end = new Date(
                (event.data.object as any).current_period_end * 1000
            );

            // end subscription
            const { error } = await supabase
                .from('profile')
                .update({
                    subscription_end_at: end,
                })
                .eq('stripe_customer_id', (event.data.object as any).customer)
                .select();

            if (error) {
                console.error(error);
                return res.status(400).send({
                    success: false,
                    error: `Webhook Error: ${error.toString()}`,
                });
            }
            return;
        }
    }

    return res.status(200).send({
        success: true,
    });
}

export async function createCheckoutSession(
    req: FastifyRequest<{
        Headers: { authorization: string };
    }>,
    res: FastifyReply
) {
    // @ts-ignore
    const user = req.user;

    const { data: profiles } = await supabase
        .from('profile')
        .select()
        .eq('id', user?.id);

    if (!user || profiles.length === 0) {
        return res.code(403).send({
            error: `You are not authorized to view this page.`,
        });
    }

    const session = await stripe.checkout.sessions.create({
        customer: profiles[0].stripe_customer_id as string,
        mode: 'subscription',
        line_items: [
            {
                price: process.env.STRIPE_SUBSCRIPTION_ID,
                quantity: 1,
            },
        ],
        subscription_data: {
            trial_period_days: 15,
        },
        payment_method_types: ['card'],
        payment_method_collection: 'always',
        success_url: `${process.env.PAYMENT_REDIRECT_HOST}/payment/success`,
        cancel_url: `${process.env.PAYMENT_REDIRECT_HOST}/payment/cancelled`,
    });

    return res.status(200).send({
        success: true,
        id: session.id,
    });
}

export async function createBillingPortalSession(
    req: FastifyRequest<{
        Headers: { authorization: string };
    }>,
    res: FastifyReply
) {
    // @ts-ignore
    const user = req.user;

    const { data: profiles } = await supabase
        .from('profile')
        .select()
        .eq('id', user?.id);

    if (!user || profiles.length === 0) {
        return res.code(403).send({
            error: `You are not authorized to view this page.`,
        });
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: profiles[0].stripe_customer_id as string,
        return_url: `${process.env.PAYMENT_REDIRECT_HOST}/`,
    });

    return res.status(200).send({
        success: true,
        url: session.url,
    });
}

export async function getUser(
    req: FastifyRequest<{
        Headers: { authorization: string };
    }>,
    res: FastifyReply
) {
    return res.status(200).send({
        // @ts-ignore
        user: req.user,
    });
}
