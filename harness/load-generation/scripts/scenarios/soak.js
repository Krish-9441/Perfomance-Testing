export function getSoakScenario(scenarioConfig) {
    const defaultStages = [
        { duration: '2m', target: 20 },  // Safely ramp up to a moderate load
        { duration: '2h', target: 20 },  // Hold for a LONG time (e.g., 2 hours)
        { duration: '2m', target: 0 },   // Ramp down
    ];

    return {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: scenarioConfig.options?.stages || defaultStages,
        exec: 'runScenario',
        env: { SCENARIO_NAME: scenarioConfig.name }
    };
}