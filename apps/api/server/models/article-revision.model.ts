export interface ArticleRevision {
  id: number;
  title: string;
  description: string;
  body: string;
  createdAt: Date;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
  };
}
