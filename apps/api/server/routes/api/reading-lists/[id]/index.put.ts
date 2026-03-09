import { definePrivateEventHandler } from '~/auth-event-handler';
import { updateReadingListSchema } from '~/schemas/reading-list.schema';
import { validateBody } from '~/utils/validate';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const { readingList } = validateBody(updateReadingListSchema, await readBody(event));
    const id = Number(getRouterParam(event, 'id'));

    if (isNaN(id)) {
        throw new HttpException(422, { errors: { id: ['must be a number'] } });
    }

    const existing = await usePrisma().readingList.findUnique({ where: { id } });

    if (!existing) {
        throw new HttpException(404, { errors: { readingList: ['not found'] } });
    }

    if (existing.userId !== auth.id) {
        throw new HttpException(403, { errors: { readingList: ['access denied'] } });
    }

    const updated = await usePrisma().readingList.update({
        where: { id },
        data: {
            ...(readingList.name !== undefined ? { name: readingList.name } : {}),
            ...(readingList.description !== undefined ? { description: readingList.description } : {}),
            ...(readingList.isPublic !== undefined ? { isPublic: readingList.isPublic } : {}),
            updatedAt: new Date(),
        },
        include: {
            _count: { select: { items: true } },
        },
    });

    const { _count, ...rest } = updated;
    return { readingList: { ...rest, articlesCount: _count.items } };
});
