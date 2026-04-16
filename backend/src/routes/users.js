const express = require('express');
const router = express.Router();
const { getSession } = require('../db/neo4j');

// POST /register
router.post('/register', async (req, res) => {
  const { username, display_name } = req.body;
  if (!username || !display_name) return res.status(400).json({ error: 'username and display_name are required' });

  const session = getSession();
  try {
    const result = await session.run(
      `CREATE (p:Person { username: $username, display_name: $displayName, created_at: datetime() }) RETURN p`,
      { username, displayName: display_name }
    );
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    if (err.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
      res.status(409).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Internal error' });
    }
  } finally {
    await session.close();
  }
});

// GET /users/:username
router.get('/users/:username', async (req, res) => {
  const { username } = req.params;
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (p:Person {username: $username})
       OPTIONAL MATCH (p)-[:FRIEND]-(f:Person)
       RETURN p, count(f) as friend_count`,
      { username }
    );
    if (result.records.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const userProperties = result.records[0].get('p').properties;
    const friendCount = result.records[0].get('friend_count').toNumber();
    res.json({ ...userProperties, friend_count: friendCount });
  } finally {
    await session.close();
  }
});

// POST /friend-request
router.post('/friend-request', async (req, res) => {
  const { from, to } = req.body;
  const session = getSession();
  try {
    await session.run(
      `MATCH (a:Person {username: $from}), (b:Person {username: $to})
       MERGE (a)-[r:FRIEND_REQUEST {sent_at: datetime()}]->(b)
       RETURN r`,
      { from, to }
    );
    res.status(200).json({ message: 'Friend request sent' });
  } finally {
    await session.close();
  }
});

// POST /friend-accept
router.post('/friend-accept', async (req, res) => {
  const { from, to } = req.body;
  // Since "from" accepted "to", or it's just establishing a two-way or single way connection.
  // We'll create single direction or bi-direction. The prompt says "Iki yonlu arkadaslik icin HER IKI YONDE de FRIEND olustur veya tek yonlu olusturup sorguyu yonsuz yap: (a)-[:FRIEND]-(b)"
  // We'll create a single relation and use undirected matches everywhere in queries.
  const session = getSession();
  try {
    await session.run(
      `MATCH (a:Person {username: $from}), (b:Person {username: $to})
       OPTIONAL MATCH (a)-[req:FRIEND_REQUEST]-(b)
       DELETE req
       MERGE (a)-[r:FRIEND {since: datetime()}]-(b)
       RETURN r`,
      { from, to }
    );
    res.status(200).json({ message: 'Friend accepted' });
  } finally {
    await session.close();
  }
});

// GET /users/:username/friends
router.get('/users/:username/friends', async (req, res) => {
  const { username } = req.params;
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (p:Person {username: $username})-[:FRIEND]-(friend:Person)
       RETURN friend`,
      { username }
    );
    const friends = result.records.map(r => r.get('friend').properties);
    res.json(friends);
  } finally {
    await session.close();
  }
});

module.exports = router;
