import { definePrivateEventHandler } from '~/auth-event-handler';
import { createModerationRuleSchema } from '~/schemas/moderation.schema';
import { validateBody } from '~/utils/validate';
import { getAuthUser, requireAdmin } from '~/utils/moderation.service';

export default definePrivateEventHandler(async (event, { auth }) => {
    const user = await getAuthUser(auth.id);
    requireAdmin(user);

    const { rule } = validateBody(createModerationRuleSchema, await readBody(event));

    const created = await usePrisma().moderationRule.create({
        data: {
            name: rule.name,
            ruleType: rule.ruleType,
            pattern: rule.pattern,
            severity: rule.severity,
            autoAction: rule.autoAction,
        },
    });

    setResponseStatus(event, 201);
    return { rule: created };
});
