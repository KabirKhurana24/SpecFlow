# Data model

The prototype persists one workspace in browser `localStorage`.

- `project`: project identity, objective, sponsor and lifecycle stage.
- `sources[]`: captured text sources with type, owner and timestamp.
- `requirements[]`: requirements with description, category, priority, status, owner, source links and acceptance criteria.
- `stories[]`: user stories linked to a requirement, with acceptance criteria and delivery state.
- `tests[]`: test cases linked to requirements and optionally stories.
- `activity[]`: timestamped workspace events used for the activity feed.

IDs are generated in the browser. Export JSON before clearing browser data or changing devices.
