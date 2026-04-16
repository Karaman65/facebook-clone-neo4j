const neo4j = require('neo4j-driver');

const uri = process.env.NEO4J_URI || 'bolt://neo4j:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'password123';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function verifyConnection() {
  const session = driver.session();
  try {
    await session.run('RETURN 1');
    console.log('Neo4j Driver initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Neo4j Driver:', error);
    return false;
  } finally {
    await session.close();
  }
}

function getSession() {
  return driver.session();
}

module.exports = {
  driver,
  getSession,
  verifyConnection
};
