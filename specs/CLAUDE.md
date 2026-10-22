# specs/ — source of truth

- `app_spec.md` is the root; each `<feature>_spec.md` covers one feature and has an **Acceptance Criteria** section.
- Acceptance criteria use the brief's global ids (`AC-01`..`AC-10`) with Given/When/Then scenarios underneath.
- A spec change goes in its own commit (`spec: ...`) before the regenerated code.
- `reviews/` holds the evaluator's sprint reviews. Do not edit a review after it is committed; add a new one.
