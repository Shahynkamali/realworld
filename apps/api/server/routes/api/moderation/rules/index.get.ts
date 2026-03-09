import { definePrivateEventHandler } from '~/auth-event-handler';
import { getAuthUser, requireModerator } from '~/utils/moderation.service';

export default definePrivateEventHandler(async (event, { auth }) => {
    const user = await getAuthUser(auth.id);
    requireModerator(user);

    const rules = await usePrisma().moderationRule.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
    });

    return { rules };
});
