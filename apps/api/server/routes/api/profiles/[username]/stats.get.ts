import HttpException from '~/models/http-exception.model';
import { definePrivateEventHandler } from '~/auth-event-handler';
import { getAuthorStats } from '~/utils/analytics.service';

export default definePrivateEventHandler(async (event) => {
    const username = getRouterParam(event, 'username');

    const stats = await getAuthorStats(username!);

    if (!stats) {
        throw new HttpException(404, { errors: { profile: ['not found'] } });
    }

    return { stats };
});
