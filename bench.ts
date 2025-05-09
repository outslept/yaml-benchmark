import { fileURLToPath } from 'node:url';
import { run, bench, group, summary } from 'mitata';
import { parse, stringify } from 'yaml';
import { load, dump } from 'js-yaml';
import { dirname, join, basename } from 'node:path';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testDataDir = join(__dirname, 'test-data');

interface YamlStringsMap {
    [key: string]: string;
}

interface JsObjectsMap {
    [key: string]: any;
}

const yamlStrings: YamlStringsMap = {};
const jsObjects: JsObjectsMap = {};

const files = readdirSync(testDataDir);

files.forEach(file => {
    if (file.endsWith('.yaml')) {
        const name = basename(file, '.yaml');
        const yamlPath = join(testDataDir, file);
        const jsonPath = join(testDataDir, `${name}_data.json`);

        yamlStrings[name] = readFileSync(yamlPath, 'utf8');

        if (existsSync(jsonPath)) {
            const jsonDataString = readFileSync(jsonPath, 'utf8');
            jsObjects[name] = JSON.parse(jsonDataString);
        } else {
            jsObjects[name] = parse(yamlStrings[name]);
        }
    }
});

console.log(`Loaded ${Object.keys(yamlStrings).length} test cases.`);

(async () => {
    summary(() => {
        group('Parse YAML', () => {
            for (const [name, yamlString] of Object.entries(yamlStrings)) {
                bench(`[eemeli/yaml] parse ${name}`, () => {
                  parse(yamlString);
                }).gc('inner');

                bench(`[nodeca/js-yaml] load ${name}`, () => {
                    load(yamlString);
                }).gc('inner');
            }
        });

        group('Stringify YAML', () => {
            for (const [name, jsObject] of Object.entries(jsObjects)) {
                bench(`[eemeli/yaml] stringify ${name}`, () => {
                  stringify(jsObject);
                }).gc('inner');

                bench(`[nodeca/js-yaml] dump ${name}`, () => {
                  dump(jsObject);
                }).gc('inner');
            }
        });
    });

    await run({});

})().catch(error => {
    console.error(error);
    process.exit(1);
});
