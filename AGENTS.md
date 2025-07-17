# AI Agent Guidelines

This repository contains the **GitLab Extended** node for n8n and is intended to be used by AI agents through n8n's "Tools AI Agent" functionality. The following guidelines describe how agents should behave when interacting with this codebase and when automating GitLab workflows.

The node surfaces almost the entire GitLab REST API, enabling automation of branches, issues, merge requests, pipelines, and more. You can inspect its schema in [`nodes/GitlabExtended/GitlabExtended.node.ts`](nodes/GitlabExtended/GitlabExtended.node.ts).

## Development Instructions

- Always run `npm run format:check`, `npm run lint`, and `npm test` before committing changes. `npm test` builds the project and executes the unit tests.
- The environment does **not** have internet access after setup. Do not run commands that attempt to fetch packages such as `npm install` or any other network operations.
- Commands for PHP or Swift are unavailable; avoid `php`, `swift build`, or their respective test commands.
- Use a project-scoped Personal Access Token with only the scopes required for the agent's role (generally `api`).

## Using the GitLab Extended Node with AI

The **GitLab Extended** node exposes nearly all of GitLab's REST API for automation. An AI agent can leverage this node as a tool to perform tasks such as:

- Creating or updating issues
- Managing merge requests and branches
- Triggering, retrying, or inspecting pipelines
- Accessing raw API endpoints for unsupported operations

The node is marked `usableAsTool: true`, so in n8n an AI agent can call its operations directly based on natural language prompts. When writing prompts, be explicit about the desired GitLab resource and action (e.g. "create an issue titled 'Upgrade dependencies'" or "merge MR !42 if the pipeline succeeded"). The agent will map these requests to the correct operation.

### Typical Agent Roles

- **Issue Tracker Agent** – triages new issues, closes stale ones, posts summary comments, and ensures the backlog stays organized.
- **Merge Request Manager Agent** – reviews open merge requests, ensures they meet merge criteria, rebases or labels them, and can merge once ready.
- **CI/CD Optimizer Agent** – monitors pipelines, retries failures, creates issues for repeated problems, and helps keep CI green.

These roles are suggestions. Agents can be customized for other workflows such as release management or support automation.

### Prompt Examples

```
• "Create an issue titled 'Upgrade dependencies' in project 123 with label 'maintenance'."
• "List open merge requests targeting `main` that have failing pipelines."
• "Merge MR !42 if it has ≥2 approvals and a successful pipeline; otherwise report the blockers."
• "Protect the 'develop' branch."
```

## Integration Steps (Summary)

1. Install this package in n8n (through Community Nodes or `npm install` beforehand).
2. Configure **Gitlab Extended API** credentials with your GitLab server URL and personal access token, or choose the <em>Custom</em> option inside the node to specify them per workflow.
3. Add an **AI Agent** node in n8n, choose an OpenAI Chat model, and attach the **GitLab Extended** tool with the chosen authentication mode.
4. Provide a clear prompt describing the task. The agent will then plan tool actions and call GitLab accordingly.

Keep prompts concise and prefer direct instructions like "fetch", "update", "create", or "delete". If multiple steps are required, describe the end goal and the agent will chain operations.

## Design Considerations

- Start with read-only or low-impact operations while testing new prompts.
- Monitor agent runs and review logs during development (enable return of intermediate steps in the n8n agent node).
- Limit the toolset to what the agent needs for its role. Provide system messages to set boundaries (e.g. "Never delete branches without explicit instruction").
- Remember token and iteration limits. Use filtering parameters (like `limit`) when listing large sets of issues, MRs, or pipelines.
- If an API call fails, log the error and stop instead of retrying indefinitely.

Following these guidelines will help agents operate safely and effectively with the GitLab Extended node.
