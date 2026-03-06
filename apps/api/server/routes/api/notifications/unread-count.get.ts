import {definePrivateEventHandler} from "~/auth-event-handler";

export default definePrivateEventHandler(async (event, {auth}) => {
    const count = await usePrisma().notification.count({
        where: {recipientId: auth.id, isRead: false},
    });

    return {count};
});
