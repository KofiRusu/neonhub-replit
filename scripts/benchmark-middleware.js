#!/usr/bin/env node

/**
 * Middleware Performance Benchmark
 * Tests the http://localhost:4000/api/health endpoint
 * Measures latency and throughput
 */

const http = require('http');

const TARGET_URL = 'http://localhost:4000/api/health';
const TOTAL_REQUESTS = 10000;
const CONCURRENT_REQUESTS = 100;

const results = {
  total: 0,
  success: 0,
  failed: 0,
  latencies: [],
  start: 0,
  end: 0
};

function makeRequest() {
  return new Promise((resolve) => {
    const start = Date.now();
    
    const req = http.get(TARGET_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - start;
        results.latencies.push(latency);
        results.success++;
        resolve();
      });
    });
    
    req.on('error', () => {
      results.failed++;
      resolve();
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      results.failed++;
      resolve();
    });
  });
}

async function runBenchmark() {
  console.log(`🚀 Starting benchmark: ${TOTAL_REQUESTS} requests to ${TARGET_URL}`);
  console.log(`   Concurrency: ${CONCURRENT_REQUESTS}\n`);
  
  results.start = Date.now();
  
  // Run requests in batches
  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_REQUESTS) {
    const batch = Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - i);
    const promises = Array(batch).fill(null).map(() => makeRequest());
    await Promise.all(promises);
    
    // Progress update every 1000 requests
    if ((i + batch) % 1000 === 0) {
      console.log(`   Progress: ${i + batch}/${TOTAL_REQUESTS}`);
    }
  }
  
  results.end = Date.now();
  results.total = results.success + results.failed;
  
  // Calculate statistics
  results.latencies.sort((a, b) => a - b);
  const totalTime = (results.end - results.start) / 1000;
  const avgLatency = results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length;
  const p50 = results.latencies[Math.floor(results.latencies.length * 0.50)];
  const p95 = results.latencies[Math.floor(results.latencies.length * 0.95)];
  const p99 = results.latencies[Math.floor(results.latencies.length * 0.99)];
  const requestsPerSec = results.success / totalTime;
  
  // Print results
  console.log(`\n✅ Benchmark Complete\n`);
  console.log(`Total Time:     ${totalTime.toFixed(2)}s`);
  console.log(`Total Requests: ${results.total}`);
  console.log(`Success:        ${results.success}`);
  console.log(`Failed:         ${results.failed}`);
  console.log(`Requests/sec:   ${requestsPerSec.toFixed(2)}`);
  console.log(`\nLatency Statistics:`);
  console.log(`  Average:  ${avgLatency.toFixed(2)}ms`);
  console.log(`  p50:      ${p50}ms`);
  console.log(`  p95:      ${p95}ms`);
  console.log(`  p99:      ${p99}ms`);
  console.log(`  Min:      ${results.latencies[0]}ms`);
  console.log(`  Max:      ${results.latencies[results.latencies.length - 1]}ms`);
  
  // Calculate middleware overhead (assuming < 5ms is acceptable)
  const overhead = avgLatency;
  console.log(`\n📊 Middleware Overhead: ${overhead.toFixed(2)}ms`);
  console.log(`   Target: < 5ms`);
  console.log(`   Status: ${overhead < 5 ? '✅ PASS' : '⚠️  Above target'}`);
}

runBenchmark().catch(console.error);