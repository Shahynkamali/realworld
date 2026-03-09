import HttpException from '~/models/http-exception.model';

export async function getOwnedReadingList(listId: number, userId: number) {
    const list = await usePrisma().readingList.findUnique({ where: { id: listId } });

    if (!list) {
        throw new HttpException(404, { errors: { readingList: ['not found'] } });
    }

    if (list.userId !== userId) {
        throw new HttpException(403, { errors: { readingList: ['access denied'] } });
    }

    return list;
}

export async function getAccessibleReadingList(listId: number, userId?: number) {
    const list = await usePrisma().readingList.findUnique({ where: { id: listId } });

    if (!list) {
        throw new HttpException(404, { errors: { readingList: ['not found'] } });
    }

    if (!list.isPublic && list.userId !== userId) {
        throw new HttpException(403, { errors: { readingList: ['access denied'] } });
    }

    return list;
}
