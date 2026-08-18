const fs = require('fs');
const path = require('path');

const k6ResultPath = path.join(__dirname, '../load-generation/results/latest-run.json');
const baselinePath = path.join(__dirname, 'baseline-store/baseline.json');

// 1. Ensure the raw JSON exists
if (!fs.existsSync(k6ResultPath)) {
    console.error('❌ Error: latest-run.json not found!');
    process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(k6ResultPath, 'utf8'));

// Helper function to safely extract metrics from k6 JSON
const getMetric = (name, field = 'avg') => {
    if (rawData.metrics[name] && rawData.metrics[name].values) {
        const val = rawData.metrics[name].values[field];
        return val !== undefined ? val : 0;
    }
    return 0;
};

// 2. Extract Primary Metrics
const currentPrimary = {
    timestamp: new Date().toISOString(),
    p95_latency: getMetric('http_req_duration', 'p(95)'),
    p99_latency: getMetric('http_req_duration', 'p(99)'),
    error_rate: getMetric('http_req_failed', 'rate'),
    throughput: getMetric('http_reqs', 'rate')
};

// 3. Extract Diagnostic Metrics
const diagnostics = {
    latency: {
        avg: getMetric('http_req_duration', 'avg'),
        med: getMetric('http_req_duration', 'med'),
        p90: getMetric('http_req_duration', 'p(90)'),
        max: getMetric('http_req_duration', 'max')
    },
    network: {
        waiting: getMetric('http_req_waiting', 'avg'),
        blocked: getMetric('http_req_blocked', 'avg'),
        connecting: getMetric('http_req_connecting', 'avg'),
        sending: getMetric('http_req_sending', 'avg'),
        receiving: getMetric('http_req_receiving', 'avg')
    },
    execution: {
        vus_max: getMetric('vus', 'max') || getMetric('vus', 'value'),
        iteration_duration_avg: getMetric('iteration_duration', 'avg'),
        data_sent_kb: getMetric('data_sent', 'count') / 1024,
        data_received_kb: getMetric('data_received', 'count') / 1024
    }
};

// --- GLOBAL SCOPE FOR BASELINE ---
let baseline = null;
if (fs.existsSync(baselinePath)) {
    baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

// 4. Generate the Terminal Report
let reportOutput = '\n======================================================\n';
reportOutput += '             PERFORMANCE TEST REPORT                  \n';
reportOutput += '======================================================\n\n';

if (baseline) {
    reportOutput += '📊 PRIMARY METRICS (vs Baseline)\n';
    reportOutput += '------------------------------------------------------\n';

    const compareTerminal = (name, current, base, lowerIsBetter = true, unit = '') => {
        const currentStr = (current.toFixed(2) + unit).padEnd(10);
        const baseStr = (base.toFixed(2) + unit).padEnd(10);
        
        if (base === 0 && current === 0) return `${name.padEnd(15)}: ${currentStr} | Base: ${baseStr} | Diff:  0.00% [PASS]`;
        
        let baseDivisor = base === 0 ? 0.0001 : base; 
        const diff = current - baseDivisor;
        const percentChange = (diff / baseDivisor) * 100;
        
        let status = 'PASS';
        const varianceBuffer = 2;
        
        if (lowerIsBetter) {
            if (percentChange > varianceBuffer) status = '🔴 REGRESSION';
            else if (percentChange < -varianceBuffer) status = '🟢 IMPROVEMENT';
        } else {
            if (percentChange < -varianceBuffer) status = '🔴 REGRESSION';
            else if (percentChange > varianceBuffer) status = '🟢 IMPROVEMENT';
        }

        const sign = percentChange > 0 ? '+' : '';
        const alignSign = percentChange >= 0 && percentChange !== 0 ? ' ' : ''; 
        return `${name.padEnd(15)}: ${currentStr} | Base: ${baseStr} | Diff: ${alignSign}${sign}${percentChange.toFixed(2)}% [${status}]`;
    };

    reportOutput += compareTerminal('P95 Latency', currentPrimary.p95_latency, baseline.p95_latency, true, 'ms') + '\n';
    reportOutput += compareTerminal('P99 Latency', currentPrimary.p99_latency, baseline.p99_latency, true, 'ms') + '\n';
    reportOutput += compareTerminal('Error Rate', currentPrimary.error_rate * 100, baseline.error_rate * 100, true, '%') + '\n';
    reportOutput += compareTerminal('Throughput', currentPrimary.throughput, baseline.throughput, false, 'r/s') + '\n';

} else {
    reportOutput += '📊 PRIMARY METRICS (Initial Baseline)\n';
    reportOutput += '------------------------------------------------------\n';
    reportOutput += `P95 Latency    : ${currentPrimary.p95_latency.toFixed(2)} ms\n`;
    reportOutput += `P99 Latency    : ${currentPrimary.p99_latency.toFixed(2)} ms\n`;
    reportOutput += `Error Rate     : ${(currentPrimary.error_rate * 100).toFixed(2)} %\n`;
    reportOutput += `Throughput     : ${currentPrimary.throughput.toFixed(2)} req/s\n`;
}

// 5. Output Diagnostics Section
reportOutput += '\n\n🔍 DIAGNOSTICS & DEBUGGING\n';
reportOutput += '------------------------------------------------------\n';
reportOutput += `Latency (ms)   : Avg: ${diagnostics.latency.avg.toFixed(2)} | Med: ${diagnostics.latency.med.toFixed(2)} | P90: ${diagnostics.latency.p90.toFixed(2)} | Max: ${diagnostics.latency.max.toFixed(2)}\n`;
reportOutput += `Network (ms)   : Wait: ${diagnostics.network.waiting.toFixed(2)} | Block: ${diagnostics.network.blocked.toFixed(2)} | Conn: ${diagnostics.network.connecting.toFixed(2)} | Send: ${diagnostics.network.sending.toFixed(2)} | Recv: ${diagnostics.network.receiving.toFixed(2)}\n`;
reportOutput += `Execution      : Max VUs: ${diagnostics.execution.vus_max} | Iteration Avg: ${diagnostics.execution.iteration_duration_avg.toFixed(2)}ms\n`;
reportOutput += `Data Transfer  : Sent: ${diagnostics.execution.data_sent_kb.toFixed(2)} KB | Recv: ${diagnostics.execution.data_received_kb.toFixed(2)} KB\n`;
reportOutput += '======================================================\n';

console.log(reportOutput);

// 6. Generate the HTML Report
const templatePath = path.join(__dirname, 'templates/report-template.html');
const htmlOutputPath = path.join(__dirname, 'report.html');

if (fs.existsSync(templatePath)) {
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    let htmlRows = '';
    
    const buildHtmlRow = (name, current, base, lowerIsBetter, unit) => {
        let status = 'PASS';
        let statusClass = 'pass';
        let diffStr = '0.00%';
        
        if (base !== 0 || current !== 0) {
            let baseDivisor = base === 0 ? 0.0001 : base;
            const diff = current - baseDivisor;
            const percentChange = (diff / baseDivisor) * 100;
            
            const varianceBuffer = 2;
            if (lowerIsBetter) {
                if (percentChange > varianceBuffer) { status = 'REGRESSION'; statusClass = 'regression'; }
                else if (percentChange < -varianceBuffer) { status = 'IMPROVEMENT'; statusClass = 'improvement'; }
            } else {
                if (percentChange < -varianceBuffer) { status = 'REGRESSION'; statusClass = 'regression'; }
                else if (percentChange > varianceBuffer) { status = 'IMPROVEMENT'; statusClass = 'improvement'; }
            }
            const sign = percentChange > 0 ? '+' : '';
            diffStr = `${sign}${percentChange.toFixed(2)}%`;
        }

        return `<tr>
            <td>${name}</td>
            <td>${current.toFixed(2)}${unit}</td>
            <td>${base.toFixed(2)}${unit}</td>
            <td>${diffStr}</td>
            <td class="${statusClass}">${status}</td>
        </tr>`;
    };

    if (baseline) {
        htmlRows += buildHtmlRow('P95 Latency', currentPrimary.p95_latency, baseline.p95_latency, true, 'ms');
        htmlRows += buildHtmlRow('P99 Latency', currentPrimary.p99_latency, baseline.p99_latency, true, 'ms');
        htmlRows += buildHtmlRow('Error Rate', currentPrimary.error_rate * 100, baseline.error_rate * 100, true, '%');
        htmlRows += buildHtmlRow('Throughput', currentPrimary.throughput, baseline.throughput, false, ' req/s');
    } else {
        htmlRows = '<tr><td colspan="5">Initial baseline set. Run again to see comparison.</td></tr>';
    }

    htmlTemplate = htmlTemplate.replace('{{TIMESTAMP}}', currentPrimary.timestamp);
    htmlTemplate = htmlTemplate.replace('{{PRIMARY_METRICS_ROWS}}', htmlRows);
    
    const diagText = `Latency (ms)   : Avg: ${diagnostics.latency.avg.toFixed(2)} | Med: ${diagnostics.latency.med.toFixed(2)} | P90: ${diagnostics.latency.p90.toFixed(2)} | Max: ${diagnostics.latency.max.toFixed(2)}
Network (ms)   : Wait: ${diagnostics.network.waiting.toFixed(2)} | Block: ${diagnostics.network.blocked.toFixed(2)} | Conn: ${diagnostics.network.connecting.toFixed(2)} | Send: ${diagnostics.network.sending.toFixed(2)} | Recv: ${diagnostics.network.receiving.toFixed(2)}
Execution      : Max VUs: ${diagnostics.execution.vus_max} | Iteration Avg: ${diagnostics.execution.iteration_duration_avg.toFixed(2)}ms
Data Transfer  : Sent: ${diagnostics.execution.data_sent_kb.toFixed(2)} KB | Recv: ${diagnostics.execution.data_received_kb.toFixed(2)} KB`;

    htmlTemplate = htmlTemplate.replace('{{DIAGNOSTICS_TEXT}}', diagText);
    fs.writeFileSync(htmlOutputPath, htmlTemplate);
    console.log(`\n📄 HTML Report generated at: ${htmlOutputPath}\n`);
}

// 7. FINALLY, save the new baseline (MUST BE THE VERY LAST STEP!)
fs.writeFileSync(baselinePath, JSON.stringify(currentPrimary, null, 2));