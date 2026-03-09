import authorMapper from './author.mapper';

const articleMapper = (article: any, id?: number) => ({
  slug: article.slug,
  title: article.title,
  description: article.description,
  body: article.body,
  tagList: article.tagList.map((tag: any) => tag.name),
  createdAt: article.createdAt,
  updatedAt: article.updatedAt,
  favorited: article.favoritedBy.some((item: any) => item.id === id),
  favoritesCount: article._count.favoritedBy,
  bookmarked: article.bookmarks ? article.bookmarks.some((b: any) => b.userId === id) : false,
  author: authorMapper(article.author, id),
});

export default articleMapper;
