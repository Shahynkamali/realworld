import { definePrivateEventHandler } from '~/auth-event-handler';
import { createReadingListSchema } from '~/schemas/reading-list.schema';
import { validateBody } from '~/utils/validate';

export default definePrivateEventHandler(async (event, { auth }) => {
    const { readingList } = validateBody(createReadingListSchema, await readBody(event));

    const created = await usePrisma().readingList.create({
        data: {
            name: readingList.name,
            description: readingList.description ?? null,
            isPublic: readingList.isPublic,
            userId: auth.id,
        },
    });

    setResponseStatus(event, 201);
    return { readingList: { ...created, articlesCount: 0 } };
});
