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
  test)
    echo "Validating YAML Configuration..."
    node harness/cli/prepare-config.js

    if [ $? -ne 0 ]; then
      echo "Aborting due to invalid configuration."
      exit 1
    fi

    echo "Running Universal k6 Engine..."
    docker run --rm -i \
      --network host \
      --env-file .env \
      -e K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
      -v "/$(pwd)/harness/load-generation/scripts://scripts" \
      -v "/$(pwd)/harness/load-generation/results://results" \
      -v "/$(pwd)/config://config" \
      grafana/k6 run -o experimental-prometheus-rw //scripts/main.js

    node harness/reporting/generate-report.js
    ;;
esac