const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { verifyConnection, getSession } = require('./db/neo4j');

const usersRoutes = require('./routes/users');
const postsRoutes = require('./routes/posts');
const messagesRoutes = require('./routes/messages');
const graphRoutes = require('./routes/graph');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Run init.cypher on startup
async function initDatabase() {
  const isConnected = await verifyConnection();
  if (!isConnected) {
    console.log('Waiting for Neo4j...');
    // In a real app we might retry, but Docker compose depends_on handles it
    return;
  }

  const session = getSession();
  try {
    const initScriptPath = path.join(__dirname, '../../init.cypher');
    const cypherContent = fs.readFileSync(initScriptPath, 'utf8');
    
    // Split by semicolons for multiple queries if needed, 
    // but the neo4j-driver can run multiple statements usually if formatted or we run one by one.
    // Constraints are often best run individually.
    const statements = cypherContent.split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('//'));
      
    for (const statement of statements) {
      if (statement) {
        await session.run(statement);
      }
    }
    console.log('Database constraints initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await session.close();
  }
}

initDatabase();

app.get('/health', async (req, res) => {
  const isConnected = await verifyConnection();
  if (isConnected) {
    res.status(200).json({ status: 'ok', neo4j: 'connected' });
  } else {
    res.status(503).json({ status: 'error', neo4j: 'disconnected' });
  }
});

// Routes
app.use('/', usersRoutes);
app.use('/', postsRoutes);
app.use('/', messagesRoutes);
app.use('/', graphRoutes);
// Using root '/' for routes because the requirements specify endpoints like /register directly, 
// rather than /users/register. So routes will define their exact paths.

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
