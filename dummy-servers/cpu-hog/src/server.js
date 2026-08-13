const express = require('express');
const client = require('prom-client');

const app = express();
const port = 3001;

// Enable default metrics collection
client.collectDefaultMetrics();

// 1. Health Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'up', service: 'cpu-hog' });
});

// 2. Metrics Endpoint (For Prometheus)
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// 3. The "Bad Actor" Endpoint
function calculateFibonacci(n) {
  if (n <= 1) return n;
  return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}

app.get('/fibonacci', (req, res) => {
  const n = parseInt(req.query.n) || 40; 
  
  const start = Date.now();
  const result = calculateFibonacci(n);
  const duration = Date.now() - start;

  res.json({ result, n, durationMs: duration });
});

app.listen(port, () => {
  console.log(`CPU Hog service listening on port ${port}`);
});