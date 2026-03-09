import HttpException from "~/models/http-exception.model";
import {definePrivateEventHandler} from "~/auth-event-handler";

export default definePrivateEventHandler(async (event, {auth}) => {
    const slug = getRouterParam(event, 'slug');

    const article = await usePrisma().article.findUnique({
        where: { slug },
        select: { id: true },
    });

    if (!article) {
        throw new HttpException(404, {errors: {article: ['not found']}});
    }

    // Identify the viewer: authenticated user by userId, anonymous by IP hash
    const userId = auth?.id ?? null;
    let ipHash: string | null = null;

    if (!userId) {
        const forwarded = getHeader(event, 'x-forwarded-for');
        const ip = forwarded?.split(',')[0]?.trim() || getHeader(event, 'x-real-ip') || 'unknown';
        const encoded = new TextEncoder().encode(ip);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
        ipHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 24h deduplication
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const existingView = await usePrisma().articleView.findFirst({
        where: {
            articleId: article.id,
            viewedAt: { gte: twentyFourHoursAgo },
            ...(userId ? { userId } : { ipHash }),
        },
    });

    if (!existingView) {
        await usePrisma().articleView.create({
            data: {
                articleId: article.id,
                userId,
                ipHash,
            },
        });
    }

    const viewCount = await usePrisma().articleView.count({
        where: { articleId: article.id },
    });

    return { viewCount };
}, {requireAuth: false});
