export default function createContext(params) {
  const calls = {};
  return {
    calls,
    getInputData() {
      return [{ json: {} }];
    },
    getNodeParameter(name, _index, defaultValue) {
      return params[name] !== undefined ? params[name] : defaultValue;
    },
    async getCredentials() {
      return { server: 'https://gitlab.example.com', accessToken: 't', projectId: 1 };
    },
    helpers: {
      async requestWithAuthentication(name, options) {
        calls.options = options;
        return {};
      },
      async httpRequest(options) {
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
      return { parameters: params };
    },
  };
}
