import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '30s',
};

export default function () {
  // Simulates a slow database query taking roughly 2 seconds
  const res = http.get('http://host.docker.internal:3004/slow-query?delay=2000');
  check(res, { 'status is 200': (r) => r.status === 200 });
}