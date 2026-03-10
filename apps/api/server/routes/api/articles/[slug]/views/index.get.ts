import HttpException from "~/models/http-exception.model";
import {definePrivateEventHandler} from "~/auth-event-handler";

export default definePrivateEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug');

    const article = await usePrisma().article.findUnique({
        where: { slug },
        select: {
            _count: { select: { views: true } },
        },
    });

    if (!article) {
        throw new HttpException(404, {errors: {article: ['not found']}});
    }

    return { viewCount: article._count.views };
}, {requireAuth: false});
