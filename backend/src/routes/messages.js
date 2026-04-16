const express = require('express');
const router = express.Router();
const { getSession } = require('../db/neo4j');
const { v4: uuidv4 } = require('uuid');

// POST /messages
router.post('/messages', async (req, res) => {
  const { from, to, content } = req.body;
  const session = getSession();
  try {
    // Check if path exists (1 or 2 hops)
    const authCheck = await session.run(
      `MATCH path = shortestPath((sender:Person {username: $from})-[:FRIEND*1..2]-(receiver:Person {username: $to}))
       RETURN CASE WHEN path IS NOT NULL THEN true ELSE false END AS can_message`,
      { from, to }
    );
    
    let canMessage = false;
    if (authCheck.records.length > 0) {
      canMessage = authCheck.records[0].get('can_message');
    }

    if (!canMessage) return res.status(403).json({ error: 'Forbidden. You can only message friends or friends of friends.' });

    const message_id = uuidv4();
    await session.run(
      `MATCH (from:Person {username: $from}), (to:Person {username: $to})
       CREATE (m:Message {message_id: $message_id, content: $content, created_at: datetime(), read: false})
       CREATE (from)-[:SENT {to: $to}]->(m)
       RETURN m`,
      { from, to, message_id, content }
    );
    res.status(201).json({ message: 'Message sent' });
  } finally {
    await session.close();
  }
});

// GET /messages/:username
router.get('/messages/:username', async (req, res) => {
  const { username } = req.params;
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (sender:Person)-[s:SENT {to: $username}]->(m:Message)
       RETURN sender.username AS from, m.content AS content, toString(m.created_at) AS created_at
       ORDER BY m.created_at DESC`,
      { username }
    );
    const msgs = result.records.map(r => ({
      from: r.get('from'),
      content: r.get('content'),
      created_at: r.get('created_at')
    }));
    res.json(msgs);
  } finally {
    await session.close();
  }
});

module.exports = router;
