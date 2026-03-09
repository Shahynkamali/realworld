import HttpException from '~/models/http-exception.model';
import {defineModEventHandler} from '~/mod-event-handler';

export default defineModEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'));

    const report = await usePrisma().report.findUnique({
        where: { id },
        include: {
            reporter: { select: { username: true } },
            moderator: { select: { username: true } },
            article: { select: { slug: true, title: true, body: true, authorId: true } },
            comment: { select: { id: true, body: true, authorId: true } },
        },
    });

    if (!report) {
        throw new HttpException(404, { errors: { report: ['not found'] } });
    }

    return { report };
});
