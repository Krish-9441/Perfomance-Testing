export function generatePayload(scenarioConfig) {
    // In the future, this file can be expanded to dynamically generate random users/data
    if (!scenarioConfig.payload) return null;
    if (scenarioConfig.payload.type === 'static' && scenarioConfig.payload.data) {
        return JSON.stringify(scenarioConfig.payload.data);
    }
    return JSON.stringify(scenarioConfig.payload);
}