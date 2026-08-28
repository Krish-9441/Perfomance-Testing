export function getAuthHeaders(config) {
    const headers = {};
    
    // Inject auth token if it exists in the environment
    if (config.auth && config.auth.token && config.auth.token.envVar) {
        const token = __ENV[config.auth.token.envVar];
        if (token) {
            const headerName = config.auth.header || 'Authorization';
            if (config.auth.type === 'api-key') {
                headers[headerName] = token;
            } else {
                headers[headerName] = `Bearer ${token}`;
            }
        }
    }
    return headers;
}