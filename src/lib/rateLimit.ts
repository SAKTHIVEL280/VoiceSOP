
import { Redis } from '@upstash/redis';

export type RateLimitResult = {
    allowed: boolean;
    retryAfterSeconds: number;
};

const redis = Redis.fromEnv();

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const windowSeconds = Math.ceil(windowMs / 1000);
    const redisKey = `voicesop:rate:${key}`;

    // Use Redis INCR and EXPIRE for atomic rate limiting
    const count = await redis.incr(redisKey);
    if (count === 1) {
        await redis.expire(redisKey, windowSeconds);
    }

    if (count > limit) {
        const ttl = await redis.ttl(redisKey);
        return {
            allowed: false,
            retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
        };
    }

    return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(headers: Headers): string {
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return headers.get('x-real-ip') || 'unknown';
}
