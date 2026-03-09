import {definePrivateEventHandler} from '~/auth-event-handler';

export default definePrivateEventHandler(async (event, {auth}) => {
    const appeals = await usePrisma().appeal.findMany({
        where: { userId: auth.id },
        orderBy: { createdAt: 'desc' },
    });

    return {
        appeals: appeals.map((a) => ({
            id: a.id,
            body: a.body,
            status: a.status,
            response: a.response,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
        })),
    };
});
