export function getSpikeScenario(scenarioConfig) {
    // Fallback defaults if the user leaves options.stages blank in the YAML
    const defaultStages = [
        { duration: '5s', target: 50 },  // Quick spike up
        { duration: '10s', target: 50 }, // Hold the spike
        { duration: '5s', target: 0 },   // Cool down
    ];

    return {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: scenarioConfig.options?.stages || defaultStages,
        exec: 'runScenario',
        env: { SCENARIO_NAME: scenarioConfig.name }
    };
}