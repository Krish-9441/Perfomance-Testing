export function getStressScenario(scenarioConfig) {
    const defaultStages = [
        { duration: '2m', target: 100 }, // Ramp up to heavy load
        { duration: '5m', target: 100 }, // Hold the stress to see if it breaks
        { duration: '2m', target: 0 },   // Ramp down gracefully
    ];

    return {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: scenarioConfig.options?.stages || defaultStages,
        exec: 'runScenario',
        env: { SCENARIO_NAME: scenarioConfig.name }
    };
}