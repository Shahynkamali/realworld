import HttpException from "~/models/http-exception.model";
import {definePrivateEventHandler} from "~/auth-event-handler";

export default definePrivateEventHandler(async (event, {auth}) => {
    const slug = getRouterParam(event, 'slug');

    const existing = await usePrisma().article.findUnique({ where: { slug } });
    if (!existing || existing.status === 'published' || existing.authorId !== auth.id) {
        throw new HttpException(404, {errors: {article: ['not found']}});
    }

    await usePrisma().article.delete({ where: { slug } });

    setResponseStatus(event, 204);
    return null;
});
