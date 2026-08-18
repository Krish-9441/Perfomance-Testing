import http from 'k6/http';
import { check, sleep } from 'k6';

// Import Scenarios
import { getSmokeScenario } from './scenarios/smoke.js';
import { getSpikeScenario } from './scenarios/spike.js';
import { getStressScenario } from './scenarios/stress.js';
import { getSoakScenario } from './scenarios/soak.js';

// Import Lib Helpers
import { loadConfig } from './lib/config-loader.js';
import { getAuthHeaders } from './lib/auth-injector.js';
import { generatePayload } from './lib/payload-generator.js';

const config = loadConfig();

// Dynamically construct k6 options based on the YAML config
const scenarios = {};
config.scenarios.forEach((scen, index) => {
    const key = `scenario_${index}`;

    // Calculate weighted virtual users if totalVus and weight are provided
    if (config.totalVus && scen.weight) {
        const allocatedVus = Math.round((scen.weight / 100) * config.totalVus);
        
        if (!scen.options) scen.options = {};
        scen.options.vus = allocatedVus;
        scen.options.targetVus = allocatedVus; 
    }

    if (scen.trafficShape === 'smoke' || scen.trafficShape === 'ramp-up') {
        scenarios[key] = getSmokeScenario(scen);
    } else if (scen.trafficShape === 'spike') {
        scenarios[key] = getSpikeScenario(scen);
    } else if (scen.trafficShape === 'stress') {
        scenarios[key] = getStressScenario(scen);
    } else if (scen.trafficShape === 'soak') {
        scenarios[key] = getSoakScenario(scen);
    }
});

export const options = { 
    scenarios: scenarios,
    thresholds: {},
    // Tell k6 exactly which math stats to include in the JSON
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count']
};

// If the user defined thresholds in the YAML, translate them for k6
if (config.thresholds) {
    if (config.thresholds.max_p95_latency_ms) {
        // e.g., 'p(95)<500'
        options.thresholds['http_req_duration'] = [`p(95)<${config.thresholds.max_p95_latency_ms}`];
    }
    if (config.thresholds.max_error_rate_percent) {
        // k6 expects error rate as a decimal (e.g., 1% is 0.01)
        const rate = config.thresholds.max_error_rate_percent / 100;
        options.thresholds['http_req_failed'] = [`rate<${rate}`];
    }
}

export function runScenario() {
    const currentScenarioName = __ENV.SCENARIO_NAME;
    const scenarioConfig = config.scenarios.find(s => s.name === currentScenarioName);

    const fullUrl = `${config.target.baseUrl}${scenarioConfig.endpoint}`;
    const method = (scenarioConfig.method || 'GET').toUpperCase();
    
    // Use our new lib functions!
    const payload = generatePayload(scenarioConfig);
    const params = { headers: getAuthHeaders(config) };

    let res;
    if (method === 'GET') {
        res = http.get(fullUrl, params);
    } else if (method === 'POST') {
        res = http.post(fullUrl, payload, params);
    } else if (method === 'PUT') {
        res = http.put(fullUrl, payload, params);
    } else if (method === 'DELETE') {
        res = http.del(fullUrl, null, params);
    }
    
    check(res, {
        'status is 200': (r) => r.status === 200,
    });
    
    sleep(1);
}

// 4. The Teardown Hook: Export the results to a JSON file
export function handleSummary(data) {
    console.log('Test finished! Exporting summary to JSON...');
    
    return {
        // Change this path to point to the absolute root directory in Docker
        '/results/latest-run.json': JSON.stringify(data, null, 2),
    };
}