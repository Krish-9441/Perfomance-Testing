const fs = require('fs');
const path = require('path');
// Note: You must run `npm install js-yaml ajv` in your harness/cli folder for this to work
const yaml = require('js-yaml');
const Ajv = require('ajv');

const configPath = path.join(__dirname, '../../config/active-config.yaml');
const schemaPath = path.join(__dirname, '../../config/schema/harness-config.schema.json');
const outputPath = path.join(__dirname, '../../config/active-config.json');

try {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const data = yaml.load(fileContents);
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
        console.error("❌ Configuration Validation Failed:", validate.errors);
        process.exit(1);
    }

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log("✅ Config validated and converted to JSON for k6.");
} catch (e) {
    console.error("Failed to parse config:", e.message);
    process.exit(1);
}