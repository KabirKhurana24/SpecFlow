# Product scope and workflow

## Problem
Business requirements frequently begin as unstructured meeting notes, email excerpts, workshop outputs and stakeholder requests. Teams need a consistent path from these inputs to approved requirements, implementable stories and verifiable tests.

## Primary personas
- Business analyst: captures discovery input, clarifies requirements and manages traceability.
- Product owner: prioritises scope and accepts or rejects proposed requirements.
- Delivery lead / engineer: consumes user stories and acceptance criteria.
- QA analyst: links test cases to the requirements they verify.

## Prototype lifecycle
1. Capture discovery source.
2. Extract candidate requirements for human review.
3. Refine and classify requirements.
4. Convert requirements to user stories and acceptance criteria.
5. Connect tests to requirements through traceability.
6. Submit requirements for stakeholder review.
7. Record decisions and inspect change impact.
8. Export a requirements baseline.

## Non-goals
- Production-grade document OCR or complex PDF parsing.
- Real identity, role-based access control or multi-user collaboration.
- Live Jira, Azure DevOps, Confluence or service-desk integrations.
- AI model inference. Local drafting helpers are deterministic and labelled accordingly.
