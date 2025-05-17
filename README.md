# n8n-nodes-extended-gitlab

This package provides an extended GitLab node for [n8n](https://n8n.io). It allows you to perform additional GitLab operations in your workflows.

## Installation

Follow the [community node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) to install the package from npm:

```bash
npm install n8n-nodes-extended-gitlab
```

## Operations

The GitLab Extended node supports the following operations:

- Branches: create, get, and list
- Pipelines: create, get, and list
- Files: get and list
- Issues: create and get
- Merge Requests: create, get, and list
- Raw API requests


## Credentials

Authentication can be configured using either a personal access token or OAuth2. Create the appropriate GitLab credentials in n8n and select them in the node.

Use the <code>Host</code> field to specify your GitLab instance's host address, for example <code>https://gitlab.your-company.com</code>. Requests automatically use the <code>/api/v4</code> path.

## Compatibility

This package requires n8n version 1.0.0 or later and is tested on Node.js 20.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [GitLab API documentation](https://docs.gitlab.com/ee/api/)

## License

[MIT](LICENSE.md)
