import HttpException from "~/models/http-exception.model";
import articleMapper from "~/utils/article.mapper";
import {definePrivateEventHandler} from "~/auth-event-handler";
import {publishDraftSchema} from '~/schemas/draft.schema';

export default definePrivateEventHandler(async (event, {auth}) => {
    const slug = getRouterParam(event, 'slug');

    const existing = await usePrisma().article.findUnique({ where: { slug } });
    if (!existing || existing.status === 'published' || existing.authorId !== auth.id) {
        throw new HttpException(404, {errors: {article: ['not found']}});
    }

    if (!existing.description || !existing.body) {
        throw new HttpException(422, {
            errors: {
                ...(existing.description ? {} : {description: ["can't be blank"]}),
                ...(existing.body ? {} : {body: ["can't be blank"]}),
            },
        });
    }

    const body = await readBody(event);
    const parsed = publishDraftSchema.parse(body);

    let status: string;
    let publishedAt: Date;

    if (parsed?.publishedAt) {
        const scheduledDate = new Date(parsed.publishedAt);
        if (scheduledDate > new Date()) {
            status = 'scheduled';
            publishedAt = scheduledDate;
        } else {
            status = 'published';
            publishedAt = scheduledDate;
        }
    } else {
        status = 'published';
        publishedAt = new Date();
    }

    const updatedArticle = await usePrisma().article.update({
        where: { slug },
        data: {
            status,
            publishedAt,
            updatedAt: new Date(),
        },
        include: {
            tagList: { select: { name: true } },
            author: {
                select: {
                    username: true,
                    bio: true,
                    image: true,
                    followedBy: true,
                },
            },
            favoritedBy: true,
            _count: { select: { favoritedBy: true } },
        },
    });

    return {article: articleMapper(updatedArticle, auth.id)};
});
