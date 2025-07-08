// Simple test script to verify the server setup
import express from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
