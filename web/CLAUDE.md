# web/ — React frontend

- React 18 + Vite. Entry `src/main.tsx`; pages in `src/pages`, shared pieces in `src/components`, API client in
  `src/api.ts`. The UI only talks to `/api/*`; it never encodes business rules beyond display (the server decides).
- Responsive: the shell switches from sidebar to top bar under 768px (`styles.css`). Keep tables inside
  `.table-wrap` so they scroll instead of widening the page.
- Every interactive element that a Playwright test touches has a `data-testid`.
- Role workbenches: Auditor, Owner, Reviewer, Admin, plus the Dashboard.
