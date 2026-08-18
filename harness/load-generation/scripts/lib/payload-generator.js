export function generatePayload(scenarioConfig) {
    // In the future, this file can be expanded to dynamically generate random users/data
    return scenarioConfig.payload ? JSON.stringify(scenarioConfig.payload) : null;
}