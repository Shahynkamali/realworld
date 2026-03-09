import HttpException from "~/models/http-exception.model";
import {definePrivateEventHandler} from "~/auth-event-handler";
import {createCommentSchema} from '~/schemas/comment.schema';
import {validateBody} from '~/utils/validate';
import {useCreateNotification} from '~/utils/notification.create';

export default definePrivateEventHandler(async (event, {auth}) => {
    const {comment} = validateBody(createCommentSchema, await readBody(event));
    const slug = getRouterParam(event, 'slug');

    const article = await usePrisma().article.findUnique({
        where: {
            slug,
        },
        select: {
            id: true,
            authorId: true,
        },
    });

    if (!article) {
        throw new HttpException(404, {errors: {article: ['not found']}});
    }

    const createdComment = await usePrisma().comment.create({
        data: {
            body: comment.body,
            article: {
                connect: {
                    id: article?.id,
                },
            },
            author: {
                connect: {
                    id: auth.id,
                },
            },
        },
        include: {
            author: {
                select: {
                    username: true,
                    bio: true,
                    image: true,
                    followedBy: true,
                },
            },
        },
    });

    await useCreateNotification({
        type: 'COMMENT',
        userId: article.authorId,
        actorId: auth.id,
        articleId: article.id,
        commentId: createdComment.id,
    });

    setResponseStatus(event, 201);
    return {
        comment: {
            id: createdComment.id,
            createdAt: createdComment.createdAt,
            updatedAt: createdComment.updatedAt,
            body: createdComment.body,
            author: {
                username: createdComment.author.username,
                bio: createdComment.author.bio,
                image: createdComment.author.image,
                following: createdComment.author.followedBy.some((follow: any) => follow.id === auth.id),
            },
        }
    };
});
