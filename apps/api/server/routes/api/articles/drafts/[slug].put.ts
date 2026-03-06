import HttpException from "~/models/http-exception.model";
import articleMapper from "~/utils/article.mapper";
import slugify from 'slugify';
import {definePrivateEventHandler} from "~/auth-event-handler";
import {updateDraftSchema} from '~/schemas/draft.schema';
import {validateBody} from '~/utils/validate';

export default definePrivateEventHandler(async (event, {auth}) => {
    const slug = getRouterParam(event, 'slug');
    const {article} = validateBody(updateDraftSchema, await readBody(event));

    const existing = await usePrisma().article.findUnique({ where: { slug } });
    if (!existing || existing.status === 'published' || existing.authorId !== auth.id) {
        throw new HttpException(404, {errors: {article: ['not found']}});
    }

    const data: any = {
        updatedAt: new Date(),
    };

    if (article.title !== undefined) {
        data.title = article.title;
        data.slug = `${slugify(article.title)}-${crypto.randomUUID().slice(0, 8)}`;
    }
    if (article.description !== undefined) data.description = article.description;
    if (article.body !== undefined) data.body = article.body;
    if (article.tagList) {
        data.tagList = {
            set: [],
            connectOrCreate: article.tagList.map((tag: string) => ({
                create: { name: tag },
                where: { name: tag },
            })),
        };
    }

    const updatedArticle = await usePrisma().article.update({
        where: { slug },
        data,
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
