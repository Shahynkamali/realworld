import HttpException from '~/models/http-exception.model';
import { definePrivateEventHandler } from '~/auth-event-handler';
import collaborationMapper from '~/utils/collaboration.mapper';

export default definePrivateEventHandler(async (event, { auth }) => {
  const id = Number(getRouterParam(event, 'id'));

  const collaboration = await usePrisma().collaboration.findFirst({
    where: { id, inviteeId: auth.id, status: 'PENDING' },
  });

  if (!collaboration) {
    throw new HttpException(404, { errors: { collaboration: ['not found'] } });
  }

  const updated = await usePrisma().collaboration.update({
    where: { id },
    data: { status: 'ACCEPTED', updatedAt: new Date() },
    include: {
      article: { select: { slug: true, title: true } },
      inviter: { select: { username: true, bio: true, image: true } },
      invitee: { select: { username: true, bio: true, image: true } },
    },
  });

  return { collaboration: collaborationMapper(updated) };
});
