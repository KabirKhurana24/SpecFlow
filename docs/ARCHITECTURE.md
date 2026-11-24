# Prototype architecture

SPECFLOW is a single-page React application bundled by Vite.

```text
Browser
  └── React UI
      ├── Discovery intake and local extraction helper
      ├── Requirement register and editor
      ├── User-story drafting workspace
      ├── Traceability and test-case management
      ├── Review queue and change-impact view
      └── Document / data export
             │
             └── localStorage (specflow-workspace-v1)
```

The helper functions in `src/utils.js` perform deterministic, local text processing and formatting. There is no backend server and no third-party API call. The UI and data model are intentionally small enough to extend with authentication, a shared database, real document parsing, LLM-backed assistance and integrations in a later implementation.
