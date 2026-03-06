import HttpException from "~/models/http-exception.model";
import {definePrivateEventHandler} from "~/auth-event-handler";

export default definePrivateEventHandler(async (event, {auth}) => {
    const id = Number(getRouterParam(event, 'id'));

    const notification = await usePrisma().notification.findUnique({
        where: {id},
    });

    if (!notification || notification.recipientId !== auth.id) {
        throw new HttpException(404, {errors: {notification: ['not found']}});
    }

    const updated = await usePrisma().notification.update({
        where: {id},
        data: {isRead: true},
    });

    return {notification: updated};
});
