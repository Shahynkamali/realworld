import { definePrivateEventHandler } from '~/auth-event-handler';
import collaborationMapper from '~/utils/collaboration.mapper';

export default definePrivateEventHandler(async (event, { auth }) => {
  const collaborations = await usePrisma().collaboration.findMany({
    where: { inviteeId: auth.id, status: 'PENDING' },
    include: {
      article: { select: { slug: true, title: true } },
      inviter: { select: { username: true, bio: true, image: true } },
      invitee: { select: { username: true, bio: true, image: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    collaborations: collaborations.map(collaborationMapper),
    collaborationsCount: collaborations.length,
  };
});
