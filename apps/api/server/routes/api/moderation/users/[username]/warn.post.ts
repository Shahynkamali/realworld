import HttpException from '~/models/http-exception.model';
import {defineModEventHandler} from '~/mod-event-handler';
import {warnUserSchema} from '~/schemas/moderation.schema';
import {validateBody} from '~/utils/validate';

export default defineModEventHandler(async (event) => {
    const username = getRouterParam(event, 'username');
    const {warning: body} = validateBody(warnUserSchema, await readBody(event));

    const user = await usePrisma().user.findUnique({
        where: { username },
        select: { id: true },
    });

    if (!user) {
        throw new HttpException(404, { errors: { user: ['not found'] } });
    }

    const warning = await usePrisma().userWarning.create({
        data: {
            reason: body.reason,
            userId: user.id,
        },
    });

    setResponseStatus(event, 201);
    return { warning };
});
