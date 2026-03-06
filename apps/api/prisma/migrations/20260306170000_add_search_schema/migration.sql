-- Create FTS5 virtual table for full-text search across articles
CREATE VIRTUAL TABLE IF NOT EXISTS article_fts USING fts5(
    title,
    description,
    body,
    tags,
    article_id UNINDEXED,
    tokenize='porter unicode61'
);

-- Populate FTS table with existing articles
INSERT INTO article_fts (article_id, title, description, body, tags)
SELECT
    a.id,
    a.title,
    a.description,
    a.body,
    COALESCE(
        (SELECT GROUP_CONCAT(t.name, ' ')
         FROM "_ArticleToTag" at2
         JOIN "Tag" t ON t.id = at2."B"
         WHERE at2."A" = a.id),
        ''
    )
FROM "Article" a;

-- Trigger: insert into FTS when a new article is created
CREATE TRIGGER article_fts_insert AFTER INSERT ON "Article"
BEGIN
    INSERT INTO article_fts (article_id, title, description, body, tags)
    VALUES (NEW.id, NEW.title, NEW.description, NEW.body, '');
END;

-- Trigger: update FTS when an article is updated
CREATE TRIGGER article_fts_update AFTER UPDATE ON "Article"
BEGIN
    DELETE FROM article_fts WHERE article_id = OLD.id;
    INSERT INTO article_fts (article_id, title, description, body, tags)
    VALUES (
        NEW.id,
        NEW.title,
        NEW.description,
        NEW.body,
        COALESCE(
            (SELECT GROUP_CONCAT(t.name, ' ')
             FROM "_ArticleToTag" at2
             JOIN "Tag" t ON t.id = at2."B"
             WHERE at2."A" = NEW.id),
            ''
        )
    );
END;

-- Trigger: delete from FTS when an article is deleted
CREATE TRIGGER article_fts_delete AFTER DELETE ON "Article"
BEGIN
    DELETE FROM article_fts WHERE article_id = OLD.id;
END;

-- Trigger: update FTS tags when a tag is linked to an article
CREATE TRIGGER article_fts_tag_insert AFTER INSERT ON "_ArticleToTag"
BEGIN
    DELETE FROM article_fts WHERE article_id = NEW."A";
    INSERT INTO article_fts (article_id, title, description, body, tags)
    SELECT
        a.id,
        a.title,
        a.description,
        a.body,
        COALESCE(
            (SELECT GROUP_CONCAT(t.name, ' ')
             FROM "_ArticleToTag" at2
             JOIN "Tag" t ON t.id = at2."B"
             WHERE at2."A" = a.id),
            ''
        )
    FROM "Article" a WHERE a.id = NEW."A";
END;

-- Trigger: update FTS tags when a tag is unlinked from an article
CREATE TRIGGER article_fts_tag_delete AFTER DELETE ON "_ArticleToTag"
BEGIN
    DELETE FROM article_fts WHERE article_id = OLD."A";
    INSERT INTO article_fts (article_id, title, description, body, tags)
    SELECT
        a.id,
        a.title,
        a.description,
        a.body,
        COALESCE(
            (SELECT GROUP_CONCAT(t.name, ' ')
             FROM "_ArticleToTag" at2
             JOIN "Tag" t ON t.id = at2."B"
             WHERE at2."A" = a.id),
            ''
        )
    FROM "Article" a WHERE a.id = OLD."A";
END;
