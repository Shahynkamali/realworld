import HttpException from '~/models/http-exception.model';

export async function checkBan(userId: number): Promise<void> {
    const user = await usePrisma().user.findUnique({
        where: { id: userId },
        select: { bannedAt: true },
    });

    if (user?.bannedAt) {
        throw new HttpException(403, { errors: { user: ['is banned'] } });
    }
}
