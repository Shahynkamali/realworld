import { definePrivateEventHandler } from '~/auth-event-handler';
import { updatePreferencesSchema } from '~/schemas/notification.schema';
import { validateBody } from '~/utils/validate';

export default definePrivateEventHandler(async (event, { auth }) => {
    const { preferences } = validateBody(updatePreferencesSchema, await readBody(event));

    const upserts = preferences.map(pref =>
        usePrisma().notificationPreference.upsert({
            where: {
                userId_notificationType: {
                    userId: auth.id,
                    notificationType: pref.type,
                },
            },
            create: {
                userId: auth.id,
                notificationType: pref.type,
                isEnabled: pref.isEnabled,
            },
            update: {
                isEnabled: pref.isEnabled,
                updatedAt: new Date(),
            },
        })
    );

    await Promise.all(upserts);

    // Return updated preferences
    const saved = await usePrisma().notificationPreference.findMany({
        where: { userId: auth.id },
    });

    const allTypes = ['follow', 'favorite', 'comment', 'reply'];
    const result = allTypes.map(type => {
        const override = saved.find(s => s.notificationType === type);
        return {
            notificationType: type,
            isEnabled: override ? override.isEnabled : true,
        };
    });

    return { preferences: result };
});
