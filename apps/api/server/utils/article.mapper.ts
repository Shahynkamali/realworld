import authorMapper from './author.mapper';

const articleMapper = (article: any, id?: number) => ({
  slug: article.slug,
  title: article.title,
  description: article.description,
  body: article.body,
  tagList: article.tagList.map((tag: any) => tag.name),
  createdAt: article.createdAt,
  updatedAt: article.updatedAt,
  status: article.status,
  publishedAt: article.publishedAt,
  favorited: article.favoritedBy.some((item: any) => item.id === id),
  favoritesCount: article._count.favoritedBy,
  author: authorMapper(article.author, id),
});

export default articleMapper;
