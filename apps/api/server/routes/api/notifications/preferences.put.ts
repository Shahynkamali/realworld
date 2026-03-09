import { definePrivateEventHandler } from "~/auth-event-handler";
import { updatePreferencesSchema } from "~/schemas/notification.schema";
import { validateBody } from "~/utils/validate";
import { NOTIFICATION_TYPES } from "~/utils/notification.service";

export default definePrivateEventHandler(async (event, { auth }) => {
  const { preferences } = validateBody(updatePreferencesSchema, await readBody(event));

  const upserts = Object.entries(preferences).map(([type, enabled]) =>
    usePrisma().notificationPreference.upsert({
      where: { userId_notificationType: { userId: auth.id, notificationType: type } },
      update: { isEnabled: enabled },
      create: { userId: auth.id, notificationType: type, isEnabled: enabled },
    })
  );

  await Promise.all(upserts);

  // Return full preferences
  const prefs = await usePrisma().notificationPreference.findMany({
    where: { userId: auth.id },
  });
  const prefMap = Object.fromEntries(NOTIFICATION_TYPES.map(t => [t, true]));
  for (const pref of prefs) {
    prefMap[pref.notificationType] = pref.isEnabled;
  }

  return { preferences: prefMap };
});
