import assert from 'node:assert';
import test from 'node:test';
import { GitlabExtendedApi } from '../dist/credentials/GitlabExtendedApi.credentials.js';

test('Gitlab Extended API credentials expose expected fields', () => {
        const cred = new GitlabExtendedApi();
        assert.strictEqual(cred.name, 'gitlabExtendedApi');
        const names = cred.properties.map((p) => p.name);
        assert.deepStrictEqual(names, [
                'server',
                'accessToken',
                'projectOwner',
                'projectName',
                'projectId',
        ]);
        assert.strictEqual(cred.test.request.url, '/user');
});
