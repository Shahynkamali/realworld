import { definePrivateEventHandler } from '~/auth-event-handler';
import { getDefaultPreferences } from '~/utils/notification.service';

export default definePrivateEventHandler(async (event, { auth }) => {
    const saved = await usePrisma().notificationPreference.findMany({
        where: { userId: auth.id },
    });

    const defaults = await getDefaultPreferences();

    // Merge saved preferences with defaults
    const preferences = defaults.map(def => {
        const override = saved.find(s => s.notificationType === def.notificationType);
        return {
            notificationType: def.notificationType,
            isEnabled: override ? override.isEnabled : def.isEnabled,
        };
    });

    return { preferences };
});
