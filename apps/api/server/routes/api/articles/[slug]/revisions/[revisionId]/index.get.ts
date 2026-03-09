import {definePrivateEventHandler} from "~/auth-event-handler";
import {getRevision} from "~/utils/revision.service";
import authorMapper from "~/utils/author.mapper";

export default definePrivateEventHandler(async (event, {auth}) => {
    const slug = getRouterParam(event, 'slug');
    const revisionId = Number(getRouterParam(event, 'revisionId'));

    const revision = await getRevision(slug!, revisionId);

    return {
        revision: {
            id: revision.id,
            title: revision.title,
            description: revision.description,
            body: revision.body,
            createdAt: revision.createdAt,
            author: authorMapper(revision.author, auth?.id),
        },
    };
}, {requireAuth: false});
