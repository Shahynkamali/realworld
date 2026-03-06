# Setup: Register user
POST {{host}}/api/users
{
  "user": {
    "username": "draft_{{uid}}",
    "email": "draft_{{uid}}@test.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
token: jsonpath "$.user.token"

# Create a draft
POST {{host}}/api/articles/drafts
Authorization: Token {{token}}
{
  "article": {
    "title": "My Draft Article {{uid}}"
  }
}
HTTP 201
[Captures]
draft_slug: jsonpath "$.article.slug"
[Asserts]
jsonpath "$.article.title" == "My Draft Article {{uid}}"
jsonpath "$.article.status" == "draft"
jsonpath "$.article.publishedAt" == null
jsonpath "$.article.description" == ""
jsonpath "$.article.body" == ""

# Draft should NOT appear in global article list
GET {{host}}/api/articles
Authorization: Token {{token}}
HTTP 200
[Asserts]
jsonpath "$.articles[?(@.slug=='{{draft_slug}}')]" count == 0

# List drafts
GET {{host}}/api/articles/drafts
Authorization: Token {{token}}
HTTP 200
[Asserts]
jsonpath "$.articlesCount" >= 1
jsonpath "$.articles[0].status" == "draft"

# Get single draft
GET {{host}}/api/articles/drafts/{{draft_slug}}
Authorization: Token {{token}}
HTTP 200
[Asserts]
jsonpath "$.article.slug" == "{{draft_slug}}"
jsonpath "$.article.status" == "draft"

# Update draft
PUT {{host}}/api/articles/drafts/{{draft_slug}}
Authorization: Token {{token}}
{
  "article": {
    "description": "Now has a description",
    "body": "Now has a body"
  }
}
HTTP 200
[Captures]
draft_slug: jsonpath "$.article.slug"
[Asserts]
jsonpath "$.article.description" == "Now has a description"
jsonpath "$.article.body" == "Now has a body"
jsonpath "$.article.status" == "draft"

# Cannot favorite a draft
POST {{host}}/api/articles/{{draft_slug}}/favorite
Authorization: Token {{token}}
HTTP 404

# Publish the draft
POST {{host}}/api/articles/drafts/{{draft_slug}}/publish
Authorization: Token {{token}}
{}
HTTP 200
[Asserts]
jsonpath "$.article.status" == "published"
jsonpath "$.article.publishedAt" != null

# Published article now appears in global list
GET {{host}}/api/articles
Authorization: Token {{token}}
HTTP 200
[Asserts]
jsonpath "$.articles[?(@.slug=='{{draft_slug}}')]" count == 1

# Draft with missing body cannot be published
POST {{host}}/api/articles/drafts
Authorization: Token {{token}}
{
  "article": {
    "title": "Incomplete Draft {{uid}}"
  }
}
HTTP 201
[Captures]
incomplete_slug: jsonpath "$.article.slug"

POST {{host}}/api/articles/drafts/{{incomplete_slug}}/publish
Authorization: Token {{token}}
{}
HTTP 422
[Asserts]
jsonpath "$.errors.description" != null
jsonpath "$.errors.body" != null

# Delete the incomplete draft
DELETE {{host}}/api/articles/drafts/{{incomplete_slug}}
Authorization: Token {{token}}
HTTP 204

# Schedule a draft for future publishing
POST {{host}}/api/articles/drafts
Authorization: Token {{token}}
{
  "article": {
    "title": "Scheduled Draft {{uid}}",
    "description": "Scheduled desc",
    "body": "Scheduled body"
  }
}
HTTP 201
[Captures]
scheduled_slug: jsonpath "$.article.slug"

POST {{host}}/api/articles/drafts/{{scheduled_slug}}/publish
Authorization: Token {{token}}
{
  "publishedAt": "2099-01-01T00:00:00Z"
}
HTTP 200
[Asserts]
jsonpath "$.article.status" == "scheduled"

# Scheduled article should NOT appear in global list (not author filter)
# Register another user to check visibility
POST {{host}}/api/users
{
  "user": {
    "username": "draft_other_{{uid}}",
    "email": "draft_other_{{uid}}@test.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
other_token: jsonpath "$.user.token"

# Other user cannot see draft via slug
GET {{host}}/api/articles/{{scheduled_slug}}
Authorization: Token {{other_token}}
HTTP 404

# Drafts endpoint requires auth
GET {{host}}/api/articles/drafts
HTTP 401
