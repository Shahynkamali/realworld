-- CreateTable
CREATE TABLE "ArticleVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "articleId" INTEGER NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" INTEGER NOT NULL,
    CONSTRAINT "ArticleVersion_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ArticleVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ArticleVersion_articleId_versionNumber_key" ON "ArticleVersion"("articleId", "versionNumber");

-- Seed: create version 1 for all existing articles
INSERT INTO "ArticleVersion" ("articleId", "versionNumber", "title", "description", "body", "tags", "createdAt", "authorId")
SELECT
    a.id,
    1,
    a.title,
    a.description,
    a.body,
    COALESCE(
        (SELECT '[' || GROUP_CONCAT('"' || REPLACE(t.name, '"', '\"') || '"') || ']'
         FROM "_ArticleToTag" at2
         JOIN "Tag" t ON t.id = at2."B"
         WHERE at2."A" = a.id),
        '[]'
    ),
    a."createdAt",
    a."authorId"
FROM "Article" a;
