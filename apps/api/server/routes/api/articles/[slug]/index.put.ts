import articleMapper from "~/utils/article.mapper";
import slugify from 'slugify';
import {definePrivateEventHandler} from "~/auth-event-handler";
import {updateArticleSchema} from '~/schemas/article.schema';
import {validateBody} from '~/utils/validate';
import {handleUniqueConstraintError} from '~/utils/prisma-errors';
import {requireArticleAccess} from '~/utils/collaborator.service';
import {createRevision} from '~/utils/revision.service';

export default definePrivateEventHandler(async (event, {auth}) => {
    const {article} = validateBody(updateArticleSchema, await readBody(event));
    const slug = getRouterParam(event, 'slug');

    const existingArticle = await requireArticleAccess(slug!, auth.id, 'editor');

    const newSlug = article.title ? `${slugify(article.title)}-${crypto.randomUUID().slice(0, 8)}` : null;

    const tagList =
        Array.isArray(article.tagList) && article.tagList?.length
            ? article.tagList.map((tag: string) => ({
                create: { name: tag },
                where: { name: tag },
            }))
            : [];

    try {
        // Snapshot current article state before updating
        await createRevision(existingArticle.id, auth.id);

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

        return {article: articleMapper(updatedArticle, auth.id)};
    } catch (e) {
        handleUniqueConstraintError(e, {slug: ['has already been taken']});
        throw e;
    }
});
