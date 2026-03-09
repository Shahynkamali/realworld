import HttpException from '~/models/http-exception.model';
import {definePrivateEventHandler} from '~/auth-event-handler';
import {createReportSchema} from '~/schemas/report.schema';
import {validateBody} from '~/utils/validate';

export default definePrivateEventHandler(async (event, {auth}) => {
    const {report} = validateBody(createReportSchema, await readBody(event));
    const slug = getRouterParam(event, 'slug');

    const article = await usePrisma().article.findUnique({
        where: { slug },
        select: { id: true },
    });

    if (!article) {
        throw new HttpException(404, {errors: {article: ['not found']}});
    }

    const created = await usePrisma().report.create({
        data: {
            reason: report.reason,
            description: report.description,
            reporterId: auth.id,
            articleId: article.id,
        },
    });

    setResponseStatus(event, 201);
    return { report: { id: created.id, reason: created.reason, status: created.status, createdAt: created.createdAt } };
});
