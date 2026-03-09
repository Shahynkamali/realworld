interface RevisionData {
  title: string;
  description: string;
  body: string;
}

interface FieldDiff {
  from: string;
  to: string;
  changed: boolean;
}

export interface RevisionDiff {
  title: FieldDiff;
  description: FieldDiff;
  body: FieldDiff;
}

export function diffRevisions(from: RevisionData, to: RevisionData): RevisionDiff {
  return {
    title: {
      from: from.title,
      to: to.title,
      changed: from.title !== to.title,
    },
    description: {
      from: from.description,
      to: to.description,
      changed: from.description !== to.description,
    },
    body: {
      from: from.body,
      to: to.body,
      changed: from.body !== to.body,
    },
  };
}
