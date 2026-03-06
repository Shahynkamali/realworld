import {definePrivateEventHandler} from "~/auth-event-handler";

export default definePrivateEventHandler(async (event, {auth}) => {
    await usePrisma().notification.updateMany({
        where: {recipientId: auth.id, isRead: false},
        data: {isRead: true},
    });

    return {success: true};
});
