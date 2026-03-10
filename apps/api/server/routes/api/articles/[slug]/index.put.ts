import HttpException from "~/models/http-exception.model";
import articleMapper from "~/utils/article.mapper";
import slugify from 'slugify';
import {definePrivateEventHandler} from "~/auth-event-handler";
import {updateArticleSchema} from '~/schemas/article.schema';
import {validateBody} from '~/utils/validate';
import {handleUniqueConstraintError} from '~/utils/prisma-errors';
import {indexArticle} from '~/utils/search.service';

export default definePrivateEventHandler(async (event, {auth}) => {
    const {article} = validateBody(updateArticleSchema, await readBody(event));
    const slug = getRouterParam(event, 'slug');

    const existingArticle = await usePrisma().article.findFirst({
        where: {
            slug,
        },
        select: {
            author: {
                select: {
                    id: true,
                    username: true,
                },
            },
        },
    });

    if (!existingArticle) {
        throw new HttpException(404, {errors: {article: ['not found']}});
    }

    if (existingArticle.author.id !== auth.id) {
        throw new HttpException(403, {errors: {article: ['forbidden']}});
    }

    const newSlug = article.title ? `${slugify(article.title)}-${crypto.randomUUID().slice(0, 8)}` : null;

    const tagList =
        Array.isArray(article.tagList) && article.tagList?.length
            ? article.tagList.map((tag: string) => ({
                create: { name: tag },
                where: { name: tag },
            }))
            : [];

    try {
        const updatedArticle = await usePrisma().$transaction(async (tx) => {
            await tx.article.update({
                where: { slug },
                data: { tagList: { set: [] } },
            });

            return tx.article.update({
                where: { slug },
                data: {
                    ...(article.title ? { title: article.title } : {}),
                    ...(article.body ? { body: article.body } : {}),
                    ...(article.description ? { description: article.description } : {}),
                    ...(newSlug ? { slug: newSlug } : {}),
                    updatedAt: new Date(),
                    // connectOrCreate issues one SELECT + conditional INSERT per tag (not batched, but ok for now)
                    tagList: {
                        connectOrCreate: tagList,
                    },
                },
                include: {
                    tagList: {
                        select: {
                            name: true,
                        },
                    },
                    author: {
                        select: {
                            username: true,
                            bio: true,
                            image: true,
                            followedBy: true,
                        },
                    },
                    favoritedBy: true,
                    _count: {
                        select: {
                            favoritedBy: true,
                        },
                    },
                },
            });
        });

        indexArticle(
            updatedArticle.id,
            updatedArticle.title,
            updatedArticle.description,
            updatedArticle.body,
        ).catch(() => {});

        return {article: articleMapper(updatedArticle, auth.id)};
    } catch (e) {
        handleUniqueConstraintError(e, {slug: ['has already been taken']});
        throw e;
    }
});
