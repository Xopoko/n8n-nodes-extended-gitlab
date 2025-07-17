export default function createContext(params) {
  const calls = {};
  const { useCustomCredentials = false, customCredentials = {} } = params;
  return {
    calls,
    getInputData() {
      return [{ json: {} }];
    },
    getNodeParameter(name) {
      if (name === 'useCustomCredentials') return useCustomCredentials;
      if (name === 'customCredentials') return customCredentials;
      return params[name];
    },
    async getCredentials() {
      calls.credentials = 'gitlabExtendedApi';
      if (useCustomCredentials) return {};
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
