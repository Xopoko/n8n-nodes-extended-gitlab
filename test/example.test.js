const { test } = require('node:test');
const assert = require('node:assert');
const { Example } = require('../dist/nodes/Example/Example.node.js');

class TestContext {
  constructor(parameters) {
    this.parameters = parameters;
  }
  getInputData() {
    return [{ json: {} }];
  }
  getNodeParameter(name) {
    return this.parameters[name];
  }
  getNode() {
    return { name: 'Example' };
  }
  continueOnFail() {
    return false;
  }
}

test('returns greeting', async () => {
  const node = new Example();
  const context = new TestContext({ name: 'Tester' });
  const result = await node.execute.call(context);
  assert.deepStrictEqual(result[0][0].json, { greeting: 'Hello Tester!' });
});
