## Merge requests

### List project merge request discussion items

Gets a list of all discussion items for a single merge request.

```
GET /projects/:id/merge_requests/:merge_request_iid/discussions
```

| Attribute | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | integer or string | yes | The ID or [URL-encoded path of the project](rest/_index.md#namespaced-paths). |
| `merge_request_iid` | integer | yes | The IID of a merge request. |

Example response omitted for brevity.

### Get single merge request discussion item

Returns a single discussion item for a specific project merge request.

```
GET /projects/:id/merge_requests/:merge_request_iid/discussions/:discussion_id
```

Parameters:

| Attribute | Type | Required | Description |
| --- | --- | --- | --- |
| `discussion_id` | string | yes | The ID of a discussion item. |
| `id` | integer or string | yes | The ID or [URL-encoded path of the project](rest/_index.md#namespaced-paths). |
| `merge_request_iid` | integer | yes | The IID of a merge request. |

### Create new merge request thread

Creates a new thread to a single project merge request.

```
POST /projects/:id/merge_requests/:merge_request_iid/discussions
```

Parameters for all comments:

| Attribute | Type | Required | Description |
| --- | --- | --- | --- |
| `body` | string | yes | The content of the thread. |
| `id` | integer/string | yes | The ID or [URL-encoded path of the project](rest/_index.md#namespaced-paths). |
| `merge_request_iid` | integer | yes | The IID of a merge request. |
| `position[base_sha]` | string | yes (if `position*` supplied) | Base commit SHA in the source branch. |
| `position[head_sha]` | string | yes (if `position*` supplied) | SHA referencing HEAD of this merge request. |
| `position[start_sha]` | string | yes (if `position*` supplied) | SHA referencing commit in target branch. |
| `position[new_path]` | string | yes (if position type is `text`) | File path after change. |
| `position[old_path]` | string | yes (if position type is `text`) | File path before change. |
| `position[position_type]` | string | yes (if `position*` supplied) | Type of the position reference. |
| `commit_id` | string | no | Optional. SHA referencing commit to start this thread on. |
| `created_at` | string | no | Optional. Date time string, ISO 8601 formatted. |
| `position` | hash | no | Optional. Position when creating a diff note. |
| `position[new_line]` | integer | no | Optional. For `text` diff notes, the line number after change. |
| `position[old_line]` | integer | no | Optional. For `text` diff notes, the line number before change. |
| `position[line_range]` | hash | no | Optional. Line range for a multi-line diff note. |
| `position[width]` | integer | no | Optional. For `image` diff notes, width of the image. |
| `position[height]` | integer | no | Optional. For `image` diff notes, height of the image. |
| `position[x]` | float | no | Optional. For `image` diff notes, X coordinate. |
| `position[y]` | float | no | Optional. For `image` diff notes, Y coordinate. |

Parameters for multiline comments:

| Attribute | Type | Required | Description |
| --- | --- | --- | --- |
| `position[line_range][end][line_code]` | string | yes | [Line code](#line-code) for the end line. |
| `position[line_range][end][type]` | string | yes | Use `new` for lines added by this commit, otherwise `old`. |
| `position[line_range][end][old_line]` | integer | no | Optional. Old line number of the end line. |
| `position[line_range][end][new_line]` | integer | no | Optional. New line number of the end line. |
| `position[line_range][start][line_code]` | string | yes | [Line code](#line-code) for the start line. |
| `position[line_range][start][type]` | string | yes | Use `new` for lines added by this commit, otherwise `old`. |
| `position[line_range][start][old_line]` | integer | no | Optional. Old line number of the start line. |
| `position[line_range][start][new_line]` | integer | no | Optional. New line number of the start line. |
| `position[line_range][end]` | hash | no | Optional. Multiline note ending line. |
| `position[line_range][start]` | hash | no | Optional. Multiline note starting line. |

### Resolve a merge request thread

```
PUT /projects/:id/merge_requests/:merge_request_iid/discussions/:discussion_id
```

| Attribute | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | integer/string | yes | The ID or [URL-encoded path of the project](rest/_index.md#namespaced-paths). |
| `discussion_id` | string | yes | The ID of a thread. |
| `merge_request_iid` | integer | yes | The IID of a merge request. |
| `resolved` | boolean | yes | Resolve or unresolve the discussion. |

### Add note to existing merge request thread

```
POST /projects/:id/merge_requests/:merge_request_iid/discussions/:discussion_id/notes
```

| Attribute | Type | Required | Description |
| --- | --- | --- | --- |
| `body` | string | yes | The content of the note or reply. |
| `id` | integer/string | yes | The ID or [URL-encoded path of the project](rest/_index.md#namespaced-paths). |
| `discussion_id` | string | yes | The ID of a thread. |
| `merge_request_iid` | integer | yes | The IID of a merge request. |
| `note_id` | integer | yes | The ID of a thread note. |
| `created_at` | string | no | Optional. Date time string, ISO 8601 formatted. |

### Modify an existing merge request thread note

```
PUT /projects/:id/merge_requests/:merge_request_iid/discussions/:discussion_id/notes/:note_id
```

| Attribute | Type | Required | Description |
| --- | --- | --- | --- |
| `discussion_id` | string | yes | The ID of a thread. |
| `id` | integer or string | yes | The ID or [URL-encoded path of the project](rest/_index.md#namespaced-paths). |
| `merge_request_iid` | integer | yes | The IID of a merge request. |
| `note_id` | integer | yes | The ID of a thread note. |
| `body` | string | no | Optional. The content of the note or reply. Exactly one of `body` or `resolved` must be set. |
| `resolved` | boolean | no | Optional. Resolve or unresolve the note. Exactly one of `body` or `resolved` must be set. |

### Delete a merge request thread note

```
DELETE /projects/:id/merge_requests/:merge_request_iid/discussions/:discussion_id/notes/:note_id
```

| Attribute | Type | Required | Description |
| --- | --- | --- | --- |
| `discussion_id` | string | yes | The ID of a thread. |
| `id` | integer or string | yes | The ID or [URL-encoded path of the project](rest/_index.md#namespaced-paths). |
| `merge_request_iid` | integer | yes | The IID of a merge request. |
| `note_id` | integer | yes | The ID of a thread note. |
