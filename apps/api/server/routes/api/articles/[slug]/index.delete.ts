import {definePrivateEventHandler} from "~/auth-event-handler";
import {requireArticleAccess} from '~/utils/collaborator.service';

export default definePrivateEventHandler(async (event, {auth}) => {
const slug = getRouterParam(event, 'slug');

    await requireArticleAccess(slug!, auth.id, 'author');

    await usePrisma().article.delete({
        where: {
            slug,
        },
    });

    setResponseStatus(event, 204);
    return null;
});
