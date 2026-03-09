import {definePrivateEventHandler} from "~/auth-event-handler";
import {listRevisions} from "~/utils/revision.service";
import authorMapper from "~/utils/author.mapper";

export default definePrivateEventHandler(async (event, {auth}) => {
    const slug = getRouterParam(event, 'slug');
    const query = getQuery(event);
    const limit = Number(query.limit) || 20;
    const offset = Number(query.offset) || 0;

    const {revisions, revisionsCount} = await listRevisions(slug!, limit, offset);

    return {
        revisions: revisions.map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            createdAt: r.createdAt,
            author: authorMapper(r.author, auth?.id),
        })),
        revisionsCount,
    };
}, {requireAuth: false});
