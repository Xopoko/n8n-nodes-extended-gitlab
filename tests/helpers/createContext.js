export default function createContext(params) {
  const calls = {};
  return {
    calls,
    getInputData() {
      return [{ json: {} }];
    },
    getNodeParameter(name) {
      return params[name];
    },
    async getCredentials() {
      return { server: 'https://gitlab.example.com', accessToken: 't', projectId: 1 };
    },
    helpers: {
      async requestWithAuthentication(name, options) {
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
