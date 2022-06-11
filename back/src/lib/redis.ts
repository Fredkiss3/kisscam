import { Client } from 'redis-om';

/* pulls the Redis URL from .env */
const url = process.env.REDIS_URL;

/* create and open the Redis OM Client */
export async function initClient() {
    return await new Client().open(url);
}
