import type { FastifyReply, FastifyRequest } from 'fastify';
import { stripe } from './lib/stripe-client';
import type Stripe from 'stripe';
import { supabase } from './lib/supabase-server';

export async function createUserIfNotExists(
    req: FastifyRequest<{
        Body: {
            uid: string;
            email: string;
        };
    }>,
    res: FastifyReply
) {
    const { data: user } = await supabase.auth.admin.getUserById(req.body.uid);

    if (!user) {
        return res.code(401).send({
            error: `This user is not registered, please retry`,
        });
    }

    const { data: profile, error } = await supabase
        .from('profile')
        .select()
        .eq('id', req.body.uid);

    if (error) {
        console.error(error);
        return res.code(400).send({
            error: `There was an error while registering, please retry`,
        });
    }

    if (profile.length === 0) {
        // create stripe customer user
        const customer = await stripe.customers.create({
            email: req.body.email,
        });

        // then create supabse profile
        const { error } = await supabase
            .from('profile')
            .insert({ id: req.body.uid, stripe_customer_id: customer.id });

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
        error: null,
        user,
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
    console.log('Received webhook event');

    try {
        event = stripe.webhooks.constructEvent(
            req.body.raw,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err) {
        console.log(`Webhook Error: ${(err as Error).message}`);

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

            const { data: profile, error } = await supabase
                .from('profile')
                .update({
                    subscribed_at: start.toISOString(),
                    subscription_end_at: end.toISOString(),
                })
                .eq('stripe_customer_id', (event.data.object as any).customer)
                .select();
            console.log({
                invoice_data: {
                    profile,
                    error,
                },
            });
            break;
        }
        case 'customer.subscription.deleted': {
            // end subscription
            const { data: profile } = await supabase
                .from('profile')
                .update({
                    subscribed_at: null,
                    subscription_end_at: null,
                })
                .eq('stripe_customer_id', (event.data.object as any).customer)
                .select();
            return;
        }
    }

    console.log({
        received: {
            type: event.type,
        },
    });

    return res.status(200).send({
        success: true,
    });
}

export async function createCheckoutSession(
    req: FastifyRequest<{
        Querystring: { data: string };
        Body: { uid: string };
    }>,
    res: FastifyReply
) {
    const {
        data: { user },
    } = await supabase.auth.admin.getUserById(req.body.uid);
    const { data: profile } = await supabase
        .from('profile')
        .select()
        .eq('id', req.body.uid);

    if (!user || profile.length === 0) {
        return res.code(401).send({
            error: `You are not authorized to view this page.`,
        });
    }

    const session = await stripe.checkout.sessions.create({
        customer: profile[0].stripe_customer_id as string,
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
        Querystring: { data: string };
        Body: { uid: string };
    }>,
    res: FastifyReply
) {
    const {
        data: { user },
    } = await supabase.auth.admin.getUserById(req.body.uid);
    const { data: profile } = await supabase
        .from('profile')
        .select()
        .eq('id', req.body.uid);

    if (!user || profile.length === 0) {
        return res.code(401).send({
            error: `You are not authorized to view this page.`,
        });
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: profile[0].stripe_customer_id as string,
        return_url: `${process.env.PAYMENT_REDIRECT_HOST}/dashboard`,
    });

    return res.status(200).send({
        success: true,
        url: session.url,
    });
}
