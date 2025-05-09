import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'test-data');
if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
}

const config = {
    NUM_ITEMS_TINY: 3,
    NUM_ITEMS_SMALL: 10,
    NUM_ITEMS_MEDIUM: 100,
    NUM_ITEMS_LARGE: 1000,
    NESTING_DEPTH_SHALLOW: 2,
    NESTING_DEPTH_MEDIUM: 4,
    NESTING_DEPTH_DEEP: 8,
    STRING_LENGTH_SHORT: 15,
    STRING_LENGTH_MEDIUM: 70,
    STRING_LENGTH_LONG: 250,
};

const CHAR_SETS = {
    ALPHANUMERIC: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    PRINTABLE_ASCII: '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~ ',
    UNICODE_SAMPLE: '你好世界äraあいしてる대한민국',
    SPECIAL_YAML_CHARS: ': {}[]&*#?|-<>=!%@`.',
};

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomString(
    minLength: number,
    maxLength: number,
    charSetKey: keyof typeof CHAR_SETS | 'MIXED' = 'ALPHANUMERIC'
): string {
    const length = getRandomInt(minLength, maxLength);
    let charSet = charSetKey === 'MIXED'
        ? CHAR_SETS.ALPHANUMERIC + CHAR_SETS.PRINTABLE_ASCII + CHAR_SETS.UNICODE_SAMPLE + CHAR_SETS.SPECIAL_YAML_CHARS
        : CHAR_SETS[charSetKey];

    if (length > 0 && charSet.length === 0) charSet = 'a';

    let result = '';
    for (let i = 0; i < length; i++) {
        result += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }

    if (Math.random() < 0.15 && result.length > 20) {
        const lines: string[] = [];
        for(let i = 0; i < result.length; i+= getRandomInt(10,40)) {
            lines.push(result.substring(i, Math.min(result.length, i + getRandomInt(10,40))));
        }
        result = lines.join('\n');
    }
     if (Math.random() < 0.05 && result.length > 5) {
        result = '  ' + result.trim() + ' ';
    }
    return result;
}

function getRandomNumber(min: number, max: number, floatPrecision?: number): number {
    const num = Math.random() * (max - min) + min;
    return floatPrecision !== undefined ? parseFloat(num.toFixed(floatPrecision)) : Math.floor(num);
}

function getRandomDate(): Date {
    return new Date(Date.now() - getRandomNumber(0, 3e11));
}

type PrimitiveTypeName = 'string' | 'number' | 'boolean' | 'null' | 'date' | 'long_string' | 'special_string' | 'unicode_string';
type ComplexTypeName = 'object' | 'array';
type ValueTypeName = PrimitiveTypeName | ComplexTypeName;

function getRandomValue(
    allowedTypes: ValueTypeName[],
    currentDepth: number,
    maxDepth: number,
    itemCountFactor = 1
): any {
    const type = getRandomElement(allowedTypes);

    switch (type) {
        case 'string':
            return getRandomString(3, config.STRING_LENGTH_SHORT, 'ALPHANUMERIC');
        case 'long_string':
            return getRandomString(config.STRING_LENGTH_MEDIUM, config.STRING_LENGTH_LONG, 'PRINTABLE_ASCII');
        case 'special_string':
            return getRandomString(config.STRING_LENGTH_SHORT, config.STRING_LENGTH_MEDIUM, 'SPECIAL_YAML_CHARS') + ' "quoted text" and \'single quotes\'';
        case 'unicode_string':
            return getRandomString(config.STRING_LENGTH_SHORT, config.STRING_LENGTH_MEDIUM, 'UNICODE_SAMPLE') + ` ${getRandomString(3,5,'ALPHANUMERIC')}`;
        case 'number':
            return Math.random() < 0.3
                ? getRandomNumber(-1e5, 1e5, getRandomInt(1, 5))
                : getRandomNumber(-1e7, 1e7);
        case 'boolean':
            return Math.random() < 0.5;
        case 'null':
            return null;
        case 'date':
            return getRandomDate();
        case 'object':
            if (currentDepth >= maxDepth) return { leaf_prop: getRandomString(3, 7) };
            return generateObject(
                Math.max(1, Math.floor(itemCountFactor * getRandomInt(config.NUM_ITEMS_TINY, config.NUM_ITEMS_SMALL))),
                currentDepth + 1,
                maxDepth,
                allowedTypes
            );
        case 'array':
            if (currentDepth >= maxDepth) return [getRandomString(3, 7), getRandomNumber(1,100)];
            return generateArray(
                Math.max(1, Math.floor(itemCountFactor * getRandomInt(config.NUM_ITEMS_TINY, config.NUM_ITEMS_SMALL))),
                currentDepth + 1,
                maxDepth,
                allowedTypes
            );
        default:
            return `unknown_type_error_in_getRandomValue`;
    }
}

function generateObject(
    numKeys: number,
    currentDepth: number,
    maxDepth: number,
    allowedValueTypes: ValueTypeName[]
): Record<string, any> {
    const obj: Record<string, any> = {};
    const usedKeys = new Set<string>();
    for (let i = 0; i < numKeys; i++) {
        let key: string;
        do {
            key = getRandomString(3, config.STRING_LENGTH_SHORT, 'ALPHANUMERIC').replace(/\s/g, '_') || `key_${i}`;
        } while (usedKeys.has(key));
        usedKeys.add(key);
        obj[key] = getRandomValue(allowedValueTypes, currentDepth, maxDepth, 0.6 / (currentDepth + 1));
    }
    return obj;
}

function generateArray(
    numItems: number,
    currentDepth: number,
    maxDepth: number,
    allowedValueTypes: ValueTypeName[]
): any[] {
    const arr: any[] = [];
    for (let i = 0; i < numItems; i++) {
        arr.push(getRandomValue(allowedValueTypes, currentDepth, maxDepth, 0.6 / (currentDepth+1)));
    }
    return arr;
}

const testCaseDefinitions: Array<{name: string; generator: () => any; options?: any}> = [
    {
        name: 'tiny_map_primitives',
        generator: () => generateObject(config.NUM_ITEMS_TINY, 0, 1, ['string', 'number', 'boolean', 'null'])
    },
    {
        name: 'small_list_mixed_primitives',
        generator: () => generateArray(config.NUM_ITEMS_SMALL, 0, 1, ['string', 'number', 'boolean', 'date'])
    },
    {
        name: 'medium_map_with_nesting',
        generator: () => generateObject(config.NUM_ITEMS_SMALL, 0, config.NESTING_DEPTH_MEDIUM, ['string', 'number', 'object', 'array', 'unicode_string'])
    },
    {
        name: 'medium_list_of_maps',
        generator: () => generateArray(config.NUM_ITEMS_MEDIUM, 0, config.NESTING_DEPTH_SHALLOW, ['object'])
    },
    {
        name: 'large_flat_map_various_strings',
        generator: () => generateObject(config.NUM_ITEMS_LARGE, 0, 1, ['string', 'long_string', 'special_string', 'unicode_string'])
    },
    {
        name: 'large_flat_list_numbers',
        generator: () => generateArray(config.NUM_ITEMS_LARGE, 0, 0, ['number'])
    },
    {
        name: 'deeply_nested_structure',
        generator: () => generateObject(2, 0, config.NESTING_DEPTH_DEEP, ['string', 'number', 'object', 'array'])
    },
    {
        name: 'wide_map_many_keys',
        generator: () => generateObject(config.NUM_ITEMS_MEDIUM * 2, 0, 1, ['string', 'boolean'])
    },
    {
        name: 'complex_mixed_document',
        generator: () => generateObject(config.NUM_ITEMS_SMALL, 0, config.NESTING_DEPTH_MEDIUM,
            ['string', 'number', 'boolean', 'null', 'date', 'long_string', 'special_string', 'unicode_string', 'object', 'array'])
    },
    {
        name: 'all_null_values_map',
        generator: () => {
            const obj: Record<string, any> = {};
            for(let i=0; i< config.NUM_ITEMS_SMALL; ++i) obj[`key${i}`] = null;
            return obj;
        }
    },
    {
        name: 'list_with_empty_maps_and_lists',
        generator: () => [{}, [], {a:1}, [], {b:[]}, [{}]]
    },
    {
        name: 'repeated_instances_for_anchors',
        generator: () => {
            const sharedObject = { detail: "This object is shared", id: getRandomString(5,10), value: getRandomNumber(1,1000) };
            const sharedArray = [getRandomString(3,8), getRandomNumber(1,50), false];
            return {
                fieldA: sharedObject,
                fieldB: { nested: sharedObject, another: "data" },
                fieldC: [sharedObject, sharedObject, {unique: true}],
                listA: sharedArray,
                listB: [1,2, ...sharedArray, 3],
                mapWithSharedList: { data: sharedArray}
            };
        }
    },
    {
        name: 'empty_top_level_map',
        generator: () => ({})
    },
    {
        name: 'empty_top_level_array',
        generator: () => ([])
    },
];

const manualCornerstones: Record<string, any> = {
    "small_simple": {
        name: "test",
        version: "1.0.2",
        active: true,
        ports: [8080, 8081],
        settings: { debug: false, log_level: "info" }
    },
    "medium_complex": {
        apiVersion: "v1", kind: "ConfigMap", metadata: { name: "cfg", namespace: "default" },
        data: {
            "player_settings.yaml": "volume: &vol 75\neffects:\n  reverb: true\n  equalizer: \"rock\"\n",
            "app_config.json": "{\n  \"theme\": \"dark\",\n  \"notifications\": {\n    \"email\": true,\n    \"sms\": false\n  },\n  \"max_users\": 1000,\n  \"retry_options\": {\n    \"attempts\": 3,\n    \"delay_ms\": 500\n  }\n}",
            master_volume: 75,
            ports: [80, 443, 8080],
            multiline_string: "This is a\nmulti-line string\nthat spans several lines.\nIt should be parsed correctly.\n"
        }
    }
};

for (const [name, data] of Object.entries(manualCornerstones)) {
    if (!testCaseDefinitions.find(def => def.name === name)) {
         testCaseDefinitions.push({name, generator: () => data});
    }
}

console.log('Generating diverse test data...');

for (const testCase of testCaseDefinitions) {
    const data = testCase.generator();
    const yamlPath = join(DATA_DIR, `${testCase.name}.yaml`);
    const jsonPath = join(DATA_DIR, `${testCase.name}_data.json`);

    const yamlString = stringify(data, testCase.options);
    writeFileSync(yamlPath, yamlString);
    writeFileSync(jsonPath, JSON.stringify(data));
    console.log(`Generated: ${testCase.name}.yaml and ${testCase.name}_data.json`);
}
