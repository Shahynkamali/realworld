import { definePrivateEventHandler } from '~/auth-event-handler';
import articleMapper from '~/utils/article.mapper';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const id = Number(getRouterParam(event, 'id'));

    if (isNaN(id)) {
        throw new HttpException(422, { errors: { id: ['must be a number'] } });
    }

    const list = await usePrisma().readingList.findUnique({ where: { id } });

    if (!list) {
        throw new HttpException(404, { errors: { readingList: ['not found'] } });
    }

    // Private lists are only accessible by owner
    if (!list.isPublic && list.userId !== auth?.id) {
        throw new HttpException(403, { errors: { readingList: ['access denied'] } });
    }

    const query = getQuery(event);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = Number(query.offset) || 0;

    const [items, total] = await Promise.all([
        usePrisma().readingListItem.findMany({
            where: { readingListId: id },
            orderBy: { addedAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                article: {
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
                },
            },
        }),
        usePrisma().readingListItem.count({ where: { readingListId: id } }),
    ]);

    const articles = items.map(item => articleMapper(item.article, auth?.id));

    return { articles, articlesCount: total };
}, { requireAuth: false });
