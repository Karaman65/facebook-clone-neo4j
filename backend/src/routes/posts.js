const express = require('express');
const router = express.Router();
const { getSession } = require('../db/neo4j');
const neo4j = require('neo4j-driver');
const { v4: uuidv4 } = require('uuid');

// POST /posts
router.post('/posts', async (req, res) => {
  const { username, content, visibility } = req.body;
  const session = getSession();
  try {
    const post_id = uuidv4();
    await session.run(
      `MATCH (p:Person {username: $username})
       CREATE (post:Post {post_id: $post_id, content: $content, visibility: $visibility, created_at: datetime()})
       CREATE (p)-[:POSTED]->(post)
       RETURN post`,
      { username, post_id, content, visibility }
    );
    res.status(201).json({ message: 'Post created' });
  } finally {
    await session.close();
  }
});

// GET /feed/:username
router.get('/feed/:username', async (req, res) => {
  const { username } = req.params;
  const limit = parseInt(req.query.limit) || 50;
  const skip = parseInt(req.query.skip) || 0;
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (me:Person {username: $username})
       MATCH (author:Person)-[:POSTED]->(post:Post)
       WHERE author = me
          OR post.visibility = 'public'
          OR (post.visibility = 'friends' AND (me)-[:FRIEND]-(author))
          OR (post.visibility = 'friends_of_friends' AND (me)-[:FRIEND*1..2]-(author))
       RETURN author.username AS username, post.content AS content, toString(post.created_at) AS created_at, post.visibility AS visibility
       ORDER BY post.created_at DESC
       SKIP $skip LIMIT $limit`,
      { username, skip: neo4j.int(skip), limit: neo4j.int(limit) }
    );
    const posts = result.records.map(r => ({
      username: r.get('username'),
      content: r.get('content'),
      created_at: r.get('created_at'),
      visibility: r.get('visibility')
    }));
    res.json(posts);
  } finally {
    await session.close();
  }
});

// GET /users/:username/posts
router.get('/users/:username/posts', async (req, res) => {
  const { username } = req.params;
  const limit = parseInt(req.query.limit) || 50;
  const skip = parseInt(req.query.skip) || 0;
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (p:Person {username: $username})-[:POSTED]->(post:Post)
       RETURN post
       ORDER BY post.created_at DESC
       SKIP $skip LIMIT $limit`,
      { username, skip: neo4j.int(skip), limit: neo4j.int(limit) }
    );
    const posts = result.records.map(r => r.get('post').properties);
    res.json(posts);
  } finally {
    await session.close();
  }
});

// POST /posts/:post_id/like
router.post('/posts/:post_id/like', async (req, res) => {
  const { post_id } = req.params;
  const { username } = req.body;
  const session = getSession();
  try {
    await session.run(
      `MATCH (p:Person {username: $username}), (post:Post {post_id: $post_id})
       MERGE (p)-[r:LIKED {liked_at: datetime()}]->(post)
       RETURN r`,
      { username, post_id }
    );
    res.status(200).json({ message: 'Post liked' });
  } finally {
    await session.close();
  }
});

module.exports = router;
