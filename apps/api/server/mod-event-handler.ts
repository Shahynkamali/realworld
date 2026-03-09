import {useVerifyToken} from '~/utils/verify-token';
import HttpException from '~/models/http-exception.model';

export interface ModContext {
    auth: {
        id: number;
        role: string;
    }
}

export function defineModEventHandler<T>(
    handler: (event: H3Event, ctx: ModContext) => T,
    options: { requireAdmin?: boolean } = {}
) {
    return defineEventHandler(async (event) => {
        const header = getHeader(event, 'authorization');
        let token;

        if (
            (header && header.split(' ')[0] === 'Token') ||
            (header && header.split(' ')[0] === 'Bearer')
        ) {
            token = header.split(' ')[1];
        }

        if (!token) {
            throw createError({
                status: 401,
                statusMessage: 'Unauthorized',
                data: {errors: {token: ['is missing']}},
            });
        }

        const auth = useVerifyToken(token);

        const user = await usePrisma().user.findUnique({
            where: { id: auth.id },
            select: { role: true, bannedAt: true },
        });

        if (!user) {
            throw new HttpException(401, { errors: { user: ['not found'] } });
        }

        if (user.bannedAt) {
            throw new HttpException(403, { errors: { user: ['is banned'] } });
        }

        if (options.requireAdmin && user.role !== 'admin') {
            throw new HttpException(403, { errors: { authorization: ['admin access required'] } });
        }

        if (!options.requireAdmin && user.role !== 'moderator' && user.role !== 'admin') {
            throw new HttpException(403, { errors: { authorization: ['moderator access required'] } });
        }

        return handler(event, { auth: { id: auth.id, role: user.role } });
    });
}
