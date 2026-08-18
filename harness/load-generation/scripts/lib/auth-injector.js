export function getAuthHeaders(config) {
    const headers = { 'Content-Type': 'application/json' };
    
    // Inject the Bearer token if it exists in the environment
    if (config.auth && config.auth.tokenEnvVar) {
        const token = __ENV[config.auth.tokenEnvVar];
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return headers;
}