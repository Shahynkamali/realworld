import {defineModEventHandler} from '~/mod-event-handler';

export default defineModEventHandler(async (event) => {
    const query = getQuery(event);
    const status = typeof query.status === 'string' ? query.status : undefined;

    const reports = await usePrisma().report.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
            reporter: { select: { username: true } },
            article: { select: { slug: true, title: true } },
            comment: { select: { id: true, body: true } },
        },
    });

    return { reports };
});
