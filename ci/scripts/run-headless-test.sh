#!/bin/bash
# Headless Test Runner for CI Environments

echo "========================================"
echo " Initiating Headless Performance Test"
echo "========================================"

# Run the main harness test command
# In a full CI setup, this might inject a specific CI override config
./harness.sh test

# Capture the exit code of the harness
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -ne 0 ]; then
    echo "❌ Load test execution failed!"
    exit $TEST_EXIT_CODE
fi

echo "✅ Headless execution completed successfully."
exit 0