import { definePrivateEventHandler } from '~/auth-event-handler';
import { createAppealSchema } from '~/schemas/moderation.schema';
import { validateBody } from '~/utils/validate';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const { appeal } = validateBody(createAppealSchema, await readBody(event));

    const action = await usePrisma().userModerationAction.findUnique({
        where: { id: appeal.moderationActionId },
    });

    if (!action) {
        throw new HttpException(404, { errors: { moderationAction: ['not found'] } });
    }

    if (action.userId !== auth.id) {
        throw new HttpException(403, { errors: { appeal: ['can only appeal your own moderation actions'] } });
    }

    // Check for existing pending appeal
    const existingAppeal = await usePrisma().appeal.findFirst({
        where: {
            moderationActionId: appeal.moderationActionId,
            status: 'pending',
        },
    });

    if (existingAppeal) {
        throw new HttpException(422, { errors: { appeal: ['a pending appeal already exists for this action'] } });
    }

    const created = await usePrisma().appeal.create({
        data: {
            userId: auth.id,
            moderationActionId: appeal.moderationActionId,
            reason: appeal.reason,
        },
    });

    setResponseStatus(event, 201);
    return { appeal: created };
});
