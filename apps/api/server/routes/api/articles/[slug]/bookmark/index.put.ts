import HttpException from "~/models/http-exception.model";
import articleMapper from "~/utils/article.mapper";
import {definePrivateEventHandler} from "~/auth-event-handler";
import {updateBookmarkSchema} from '~/schemas/bookmark.schema';
import {validateBody} from '~/utils/validate';

export default definePrivateEventHandler(async (event, {auth}) => {
    const slug = getRouterParam(event, "slug");
    const {bookmark} = validateBody(updateBookmarkSchema, await readBody(event));

    const article = await usePrisma().article.findUnique({ where: { slug } });
    if (!article || article.status !== 'published') {
        throw new HttpException(404, {errors: {article: ['not found']}});
    }

    const existing = await usePrisma().bookmark.findUnique({
        where: {
            userId_articleId: {
                userId: auth.id,
                articleId: article.id,
            },
        },
    });

    if (!existing) {
        throw new HttpException(404, {errors: {bookmark: ['not found']}});
    }

    await usePrisma().bookmark.update({
        where: { id: existing.id },
        data: { read: bookmark.read },
    });

    const updatedArticle = await usePrisma().article.findUnique({
        where: { slug },
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
            bookmarkedBy: { select: { userId: true } },
            _count: { select: { favoritedBy: true } },
        },
    });

    return {article: articleMapper(updatedArticle, auth.id)};
});
