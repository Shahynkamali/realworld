import HttpException from "~/models/http-exception.model";
import profileMapper from "~/utils/profile.utils";
import {definePrivateEventHandler} from "~/auth-event-handler";
import {notifyFollow} from "~/utils/notification.service";

export default definePrivateEventHandler(async (event, {auth}) => {
    const username = getRouterParam(event, 'username');

    const user = await usePrisma().user.findUnique({
        where: { username },
    });

    if (!user) {
        throw new HttpException(404, {errors: {profile: ['not found']}});
    }

    const actor = await usePrisma().user.findUnique({
        where: { id: auth.id },
        select: { username: true },
    });

    const profile = await usePrisma().user.update({
        where: {
            username,
        },
        data: {
            followedBy: {
                connect: {
                    id: auth.id,
                },
            },
        },
        include: {
            followedBy: true,
        },
    });

    notifyFollow(auth.id, actor!.username, user.id).catch(() => {});

    return {profile: profileMapper(profile, auth.id)};
});
