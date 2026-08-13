import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 5, // Lowered so the server survives long enough to send metrics
  duration: '30s',
};

export default function () {
  // Hit the hoarder endpoint 
  http.get('http://host.docker.internal:3003/hold');
  sleep(1);
}