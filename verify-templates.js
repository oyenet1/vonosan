import { generateTemplates } from './packages/create-vonosan/dist/templates.js';

const answers = {
    projectName: 'test-project',
    language: 'ts',
    projectType: 'fullstack',
    packageManager: 'bun',
    deploymentTarget: 'bun',
    database: 'postgres',
    queue: 'none',
    queueRedisDriver: 'none',
    cache: 'none',
    email: 'none',
    storage: 'none',
    websocket: false,
    websocketDriver: 'none',
    notifications: false,
    logging: false,
    auth: false,
    passwordReset: false,
    roles: false,
    testing: 'none',
    apiDocs: false,
    saas: false
};

const templates = generateTemplates(answers);

const checks = [
    { name: 'src/modules/home/index.page.vue', check: (ts) => ts['src/modules/home/index.page.vue'] !== undefined },
    { name: 'src/env.d.ts', check: (ts) => ts['src/env.d.ts'] !== undefined },
    { name: 'route-rules mode syntax', check: (ts) => {
        const config = ts['vonosan.config.ts'] || ts['vonosan.config.js'];
        return config && config.includes('routeRules');
    }},
    { name: 'createUnhead in src/main.ts', check: (ts) => {
        const main = ts['src/main.ts'] || ts['src/main.js'];
        return main && main.includes('createUnhead');
    }}
];

checks.forEach(c => {
    const passed = c.check(templates);
    console.log(`${c.name}: ${passed ? 'PASS' : 'FAIL'}`);
});
