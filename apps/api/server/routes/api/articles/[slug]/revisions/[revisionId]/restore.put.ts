import {definePrivateEventHandler} from "~/auth-event-handler";
import {restoreRevision} from "~/utils/revision.service";
import articleMapper from "~/utils/article.mapper";

export default definePrivateEventHandler(async (event, {auth}) => {
    const slug = getRouterParam(event, 'slug');
    const revisionId = Number(getRouterParam(event, 'revisionId'));

    const updatedArticle = await restoreRevision(slug!, revisionId, auth.id);

    return {article: articleMapper(updatedArticle, auth.id)};
});
