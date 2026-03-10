import {definePrivateEventHandler} from '~/auth-event-handler';
import {createAppealSchema} from '~/schemas/appeal.schema';
import {validateBody} from '~/utils/validate';

export default definePrivateEventHandler(async (event, {auth}) => {
    const {appeal} = validateBody(createAppealSchema, await readBody(event));

    const created = await usePrisma().appeal.create({
        data: {
            body: appeal.body,
            userId: auth.id,
        },
    });

    setResponseStatus(event, 201);
    return {
        appeal: {
            id: created.id,
            body: created.body,
            status: created.status,
            createdAt: created.createdAt,
        },
    };
});
