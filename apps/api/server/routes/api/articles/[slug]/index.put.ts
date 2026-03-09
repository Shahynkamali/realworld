import HttpException from "~/models/http-exception.model";
import articleMapper from "~/utils/article.mapper";
import slugify from 'slugify';
import {definePrivateEventHandler} from "~/auth-event-handler";
import {updateArticleSchema} from '~/schemas/article.schema';
import {validateBody} from '~/utils/validate';
import {handleUniqueConstraintError} from '~/utils/prisma-errors';
import {useCreateNotification} from '~/utils/notification.create';

export default definePrivateEventHandler(async (event, {auth}) => {
    const {article} = validateBody(updateArticleSchema, await readBody(event));
    const slug = getRouterParam(event, 'slug');

    const existingArticle = await usePrisma().article.findFirst({
        where: {
            slug,
        },
        select: {
            id: true,
            title: true,
            description: true,
            body: true,
            author: {
                select: {
                    id: true,
                    username: true,
                },
            },
            collaborations: {
                where: { status: 'ACCEPTED' },
                select: { inviteeId: true },
            },
        },
    });

    if (!existingArticle) {
        throw new HttpException(404, {errors: {article: ['not found']}});
    }

    const isAuthor = existingArticle.author.id === auth.id;
    const isCollaborator = existingArticle.collaborations.some(c => c.inviteeId === auth.id);

    if (!isAuthor && !isCollaborator) {
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
            // Snapshot current state as a revision
            await tx.revision.create({
                data: {
                    title: existingArticle.title,
                    description: existingArticle.description,
                    body: existingArticle.body,
                    articleId: existingArticle.id,
                    authorId: auth.id,
                },
            });

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

        if (!isAuthor) {
            await useCreateNotification({
                type: 'REVISION_CHANGE',
                userId: existingArticle.author.id,
                actorId: auth.id,
                articleId: existingArticle.id,
            });
        }

        return {article: articleMapper(updatedArticle, auth.id)};
    } catch (e) {
        handleUniqueConstraintError(e, {slug: ['has already been taken']});
        throw e;
    }
});
