export default function createContext(params) {
  const calls = {};
  const fullParams = { authentication: 'credential', ...params };
  return {
    calls,
    getInputData() {
      return [{ json: {} }];
    },
    getNodeParameter(name) {
      return fullParams[name];
    },
    async getCredentials() {
      return { server: 'https://gitlab.example.com', accessToken: 't', projectId: 1 };
    },
    helpers: {
      async requestWithAuthentication(name, options) {
        calls.options = options;
        return {};
      },
      async request(options) {
        calls.options = options;
        return {};
      },
      constructExecutionMetaData(data) {
        return data;
      },
      returnJsonArray(data) {
        return [{ json: data }];
      },
    },
    getNode() {
      return { parameters: fullParams };
    },
  };
}
