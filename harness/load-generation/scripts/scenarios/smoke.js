export function getSmokeScenario(scenarioConfig) {
    // If the user provided options in YAML, use them. Otherwise, default to 1 VU for 10s.
    const vus = scenarioConfig.options?.vus || 1;
    const duration = scenarioConfig.options?.duration || '10s';

    return {
        executor: 'constant-vus',
        vus: vus,
        duration: duration,
        exec: 'runScenario',
        env: { SCENARIO_NAME: scenarioConfig.name } 
    };
}