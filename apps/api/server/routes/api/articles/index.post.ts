import articleMapper from "~/utils/article.mapper";
import slugify from 'slugify';
import {definePrivateEventHandler} from "~/auth-event-handler";
import {createArticleSchema} from '~/schemas/article.schema';
import {validateBody} from '~/utils/validate';
import {handleUniqueConstraintError} from '~/utils/prisma-errors';
import {checkBan} from '~/utils/check-ban';
import {analyzeContent} from '~/utils/content-moderation';
import {calculateReadingTime} from '~/utils/reading-time';
import {ftsIndexArticle} from '~/utils/fts';

export default definePrivateEventHandler(async (event, {auth}) => {
    await checkBan(auth.id);

    const {article} = validateBody(createArticleSchema, await readBody(event));

    const {title, description, body, tagList} = article;

    const slug = `${slugify(title)}-${crypto.randomUUID().slice(0, 8)}`;

    try {
        const {
            authorId,
            id: articleId,
            ...createdArticle
        } = await usePrisma().article.create({
            data: {
                title,
                description,
                body,
                slug,
                readingTime: calculateReadingTime(body),
                // connectOrCreate issues one SELECT + conditional INSERT per tag (not batched, but ok for now)
                tagList: {
                    connectOrCreate: tagList.map((tag: string) => ({
                        create: { name: tag },
                        where: { name: tag },
                    })),
                },
                author: {
                    connect: {
                        id: auth.id,
                    },
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
                        views: true,
                    },
                },
            },
        });

        const contentToAnalyze = `${title} ${description} ${body}`;
        const modResult = analyzeContent(contentToAnalyze);
        if (modResult.flagged) {
            await usePrisma().report.create({
                data: {
                    reason: 'spam',
                    description: modResult.reasons.join('; '),
                    autoFlagged: true,
                    articleId: articleId,
                },
            });
        }

        try {
            await ftsIndexArticle(articleId, title, description, body);
        } catch (_) { /* FTS sync failure is non-critical */ }

        setResponseStatus(event, 201);
        return {article: articleMapper(createdArticle, auth.id)};
    } catch (e) {
        handleUniqueConstraintError(e, {slug: ['has already been taken']});
        throw e;
    }
});
