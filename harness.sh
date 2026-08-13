#!/bin/bash

COMMAND=$1

case "$COMMAND" in
  up)
    echo "Starting full testing stack (Monitoring + Dummy Services)..."
    docker compose up -d --build
    echo "Check status to ensure all services say (healthy):"
    docker compose ps
    ;;
  down)
    echo "Tearing down entire testing harness..."
    docker compose down -v
    ;;
  status)
    docker compose ps
    ;;
 test-cpu)
    echo "Running CPU Hog load test..."
    docker run --rm -i \
      -e K6_PROMETHEUS_RW_SERVER_URL=http://host.docker.internal:9090/api/v1/write \
      -v "/$(pwd)/harness/load-generation/scripts://scripts" \
      grafana/k6 run -o experimental-prometheus-rw //scripts/cpu-hog.js
    ;;
  test-mem)
    echo "Running Memory Leaker load test..."
    docker run --rm -i \
      -e K6_PROMETHEUS_RW_SERVER_URL=http://host.docker.internal:9090/api/v1/write \
      -v "/$(pwd)/harness/load-generation/scripts://scripts" \
      grafana/k6 run -o experimental-prometheus-rw //scripts/memory-leaker.js
    ;;
  test-socket)
    echo "Running Socket Hoarder load test..."
    docker run --rm -i \
      -e K6_PROMETHEUS_RW_SERVER_URL=http://host.docker.internal:9090/api/v1/write \
      -v "/$(pwd)/harness/load-generation/scripts://scripts" \
      grafana/k6 run -o experimental-prometheus-rw //scripts/socket-hoarder.js
    ;;
  test-io)
    echo "Running Sluggish I/O load test..."
    docker run --rm -i \
      -e K6_PROMETHEUS_RW_SERVER_URL=http://host.docker.internal:9090/api/v1/write \
      -v "/$(pwd)/harness/load-generation/scripts://scripts" \
      grafana/k6 run -o experimental-prometheus-rw //scripts/sluggish-io.js
    ;;
  *)
    echo "Usage: ./harness.sh {up|down|status|test-cpu|test-mem|test-socket|test-io}"
    exit 1
    ;;
esac

#unused comment