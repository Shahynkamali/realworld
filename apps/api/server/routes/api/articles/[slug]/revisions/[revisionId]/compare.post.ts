import {definePrivateEventHandler} from "~/auth-event-handler";
import {getRevision} from "~/utils/revision.service";
import {diffRevisions} from "~/utils/diff.service";

export default definePrivateEventHandler(async (event, {auth}) => {
    const slug = getRouterParam(event, 'slug');
    const revisionId = Number(getRouterParam(event, 'revisionId'));
    const body = await readBody(event);
    const compareWithId = Number(body.revisionId);

    if (!compareWithId) {
        throw createError({
            status: 422,
            data: {errors: {revisionId: ['is required']}},
        });
    }

    const [from, to] = await Promise.all([
        getRevision(slug!, revisionId),
        getRevision(slug!, compareWithId),
    ]);

    return {diff: diffRevisions(from, to)};
});
