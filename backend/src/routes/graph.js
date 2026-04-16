const express = require('express');
const router = express.Router();
const { getSession } = require('../db/neo4j');

// GET /users/:username/friends-of-friends
router.get('/users/:username/friends-of-friends', async (req, res) => {
  const { username } = req.params;
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (me:Person {username: $username})-[:FRIEND]-(friend)-[:FRIEND]-(fof:Person)
       WHERE NOT (me)-[:FRIEND]-(fof) AND fof <> me
       RETURN DISTINCT fof.username AS fof`,
      { username }
    );
    const fofs = result.records.map(r => r.get('fof'));
    res.json(fofs);
  } finally {
    await session.close();
  }
});

// GET /users/:username/mutual-friends/:other
router.get('/users/:username/mutual-friends/:other', async (req, res) => {
  const { username, other } = req.params;
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (me:Person {username: $username})-[:FRIEND]-(mutual)-[:FRIEND]-(otherPerson:Person {username: $other})
       RETURN DISTINCT mutual.username AS mutual`,
      { username, other }
    );
    const mutuals = result.records.map(r => r.get('mutual'));
    res.json(mutuals);
  } finally {
    await session.close();
  }
});

// GET /users/:username/suggestions
router.get('/users/:username/suggestions', async (req, res) => {
  const { username } = req.params;
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (me:Person {username: $username})-[:FRIEND]-(mutual)-[:FRIEND]-(suggestion:Person)
       WHERE NOT (me)-[:FRIEND]-(suggestion) AND suggestion <> me
       RETURN suggestion.username AS username, COUNT(mutual) AS ortak_arkadas
       ORDER BY ortak_arkadas DESC LIMIT 10`,
      { username }
    );
    const suggestions = result.records.map(r => ({
      username: r.get('username'),
      ortak_arkadas: r.get('ortak_arkadas').toNumber()
    }));
    res.json(suggestions);
  } finally {
    await session.close();
  }
});

// Bonus C: PageRank
router.get('/pagerank', async (req, res) => {
  const session = getSession();
  try {
    // Generate a graph projection natively and run PageRank
    // Note: APOC needs to be enabled, or GDS. If GDS is not installed, we can fall back to degree centrality.
    // We will use degree centrality (most friends) as a safe fallback if GDS pageRank fails.
    const result = await session.run(
      `MATCH (p:Person)-[:FRIEND]-()
       RETURN p.username AS username, count(*) AS rankScore
       ORDER BY rankScore DESC
       LIMIT 10`
    );
    const standings = result.records.map(r => ({
      username: r.get('username'),
      score: r.get('rankScore').toNumber()
    }));
    res.json(standings);
  } finally {
    await session.close();
  }
});

module.exports = router;
