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
- Merge Requests:
  - Create
  - Manage labels: Add or remove labels on a merge request. Use the `labelAction` parameter to specify the action (`add` or `remove`) and provide the list of labels to modify.
  - Manage notes and discussions
  - Get
  - List
  - Get discussion by ID
  - List discussions
- Raw API requests

### Example: Managing Labels on a Merge Request

To add labels to a merge request, use the `manageLabels` operation with the following parameters:

- `mergeRequestId`: The ID of the merge request.
- `labelAction`: Set to `add` to add labels or `remove` to remove labels.
- `labels`: A comma-separated list of labels to add or remove.

Example:

```json
{
  "operation": "manageLabels",
  "mergeRequestId": 123,
  "labelAction": "add",
  "labels": "bug,urgent"
}

## Credentials

Authentication is handled exclusively via the <code>Gitlab Extended API</code> credentials. Create these credentials in n8n to store your GitLab server, access token and default project details in one place.

The credentials' <code>server</code> field specifies your GitLab instance host (e.g. <code>https://gitlab.your-company.com</code>). Requests automatically use the <code>/api/v4</code> path.

## Compatibility

This package requires n8n version 1.0.0 or later and is tested on Node.js 20.

## Tool usage for AI

The node is marked with `usableAsTool: true`, so it can be invoked by n8n's AI
features. After installing the package and creating the **Gitlab Extended API**
credentials, the node appears in the list of available tools when building
generative AI workflows. An AI agent can call any of the supported operations—
such as fetching files or creating issues—by providing the necessary
parameters in natural language. The node runs using the credentials you
configured, enabling automated access to your GitLab projects from AI-driven
flows.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [GitLab API documentation](https://docs.gitlab.com/ee/api/)

## License

[MIT](LICENSE.md)
