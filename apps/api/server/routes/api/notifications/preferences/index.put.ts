import { definePrivateEventHandler } from '~/auth-event-handler';
import { updatePreferencesSchema } from '~/schemas/notification-preference.schema';
import { validateBody } from '~/utils/validate';

export default definePrivateEventHandler(async (event, { auth }) => {
  const { preferences } = validateBody(updatePreferencesSchema, await readBody(event));

  await usePrisma().$transaction(
    preferences.map((pref) =>
      usePrisma().notificationPreference.upsert({
        where: { userId_type: { userId: auth.id, type: pref.type } },
        update: { enabled: pref.enabled },
        create: { userId: auth.id, type: pref.type, enabled: pref.enabled },
      }),
    ),
  );

  const dbPreferences = await usePrisma().notificationPreference.findMany({
    where: { userId: auth.id },
  });

  const { NOTIFICATION_TYPES } = await import('~/models/notification.model');
  const prefMap = new Map(dbPreferences.map((p) => [p.type, p.enabled]));

  return {
    preferences: NOTIFICATION_TYPES.map((type) => ({
      type,
      enabled: prefMap.has(type) ? prefMap.get(type)! : true,
    })),
  };
});
