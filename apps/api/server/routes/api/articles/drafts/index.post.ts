import articleMapper from "~/utils/article.mapper";
import slugify from 'slugify';
import {definePrivateEventHandler} from "~/auth-event-handler";
import {createDraftSchema} from '~/schemas/draft.schema';
import {validateBody} from '~/utils/validate';
import {handleUniqueConstraintError} from '~/utils/prisma-errors';

export default definePrivateEventHandler(async (event, {auth}) => {
    const {article} = validateBody(createDraftSchema, await readBody(event));

    const {title, description, body, tagList} = article;

    const slug = `${slugify(title)}-${crypto.randomUUID().slice(0, 8)}`;

    try {
        const createdArticle = await usePrisma().article.create({
            data: {
                title,
                description,
                body,
                slug,
                status: 'draft',
                tagList: {
                    connectOrCreate: tagList.map((tag: string) => ({
                        create: { name: tag },
                        where: { name: tag },
                    })),
                },
                author: {
                    connect: { id: auth.id },
                },
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

        setResponseStatus(event, 201);
        return {article: articleMapper(createdArticle, auth.id)};
    } catch (e) {
        handleUniqueConstraintError(e, {slug: ['has already been taken']});
        throw e;
    }
});
