import { SharedArray } from 'k6/data';

export function loadConfig() {
    // This safely loads the JSON file exactly once per test run
    return new SharedArray('Config', function () {
        return [JSON.parse(open('../../../../config/active-config.json'))];
    })[0];
}