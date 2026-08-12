import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50, // High concurrency to exhaust the connection pool quickly
  duration: '30s',
};

export default function () {
  // Hit the hoarder endpoint (it will hold the connection open)
  const res = http.get('http://host.docker.internal:3003/hold-connection');
  // We don't check for 200 OK here because we expect timeouts and resets!
  sleep(1);
}