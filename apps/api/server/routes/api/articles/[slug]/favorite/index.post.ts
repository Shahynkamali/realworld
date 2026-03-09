import HttpException from "~/models/http-exception.model";
import profileMapper from "~/utils/profile.utils";
import {Tag} from "~/models/tag.model";
import {definePrivateEventHandler} from "~/auth-event-handler";
import {notifyFavorite} from '~/utils/notification.service';

export default definePrivateEventHandler(async (event, {auth}) => {
    const slug = getRouterParam(event, "slug");

    const existing = await usePrisma().article.findUnique({ where: { slug } });
    if (!existing) {
        throw new HttpException(404, {errors: {article: ['not found']}});
    }

    const { _count, ...article } = await usePrisma().article.update({
        where: {
            slug,
        },
        data: {
            favoritedBy: {
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
                },
            },
        },
    });

    const result = {
        ...article,
        author: profileMapper(article.author, auth.id),
        tagList: article?.tagList.map((tag: Tag) => tag.name),
        favorited: article.favoritedBy.some((favorited: any) => favorited.id === auth.id),
        favoritesCount: _count?.favoritedBy,
    };

    // Notify article author about the favorite
    const actor = await usePrisma().user.findUnique({
        where: { id: auth.id },
        select: { username: true },
    });
    if (actor) {
        notifyFavorite(auth.id, existing.authorId, actor.username, existing.title, existing.id).catch(() => {});
    }

    return {article: result};
});
