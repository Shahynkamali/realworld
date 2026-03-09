import HttpException from '~/models/http-exception.model';

export function requireModerator(user: { moderatorRole: string }) {
    if (user.moderatorRole !== 'moderator' && user.moderatorRole !== 'admin') {
        throw new HttpException(403, { errors: { authorization: ['moderator role required'] } });
    }
}

export function requireAdmin(user: { moderatorRole: string }) {
    if (user.moderatorRole !== 'admin') {
        throw new HttpException(403, { errors: { authorization: ['admin role required'] } });
    }
}

export function requireNotBanned(user: { isBanned: boolean }) {
    if (user.isBanned) {
        throw new HttpException(403, { errors: { user: ['is banned from performing this action'] } });
    }
}

export async function getAuthUser(userId: number) {
    const user = await usePrisma().user.findUnique({
        where: { id: userId },
        select: { id: true, moderatorRole: true, isBanned: true },
    });

    if (!user) {
        throw new HttpException(404, { errors: { user: ['not found'] } });
    }

    return user;
}
