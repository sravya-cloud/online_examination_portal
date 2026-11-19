# Development freeze (B-17)

The freeze starts when the team agrees all Sprint 2 pull requests are merged. The date is set once the instructor confirms the Sprint 2 dates. Until then this page is the checklist.

## Rules after the freeze

- No new features. Only fixes for defects found while preparing the demo.
- Every fix is a small pull request that names the defect, passes CI, and is merged by the repository owner.
- Documentation corrections are allowed.
- Database migrations are not allowed after the freeze.

## Checklist before declaring the freeze

- [ ] All open feature pull requests are merged or closed.
- [ ] `npm test` passes in `server/`, and `npm run lint` and `npm run build` pass in `client/`.
- [ ] The main branch CI run is green.
- [ ] `docs/test-traceability.md` has no Planned rows, or each one is explained.
- [ ] `docs/deviations-note.md` matches what was built.
- [ ] README setup steps work on a clean clone.
- [ ] The Sprint 1 and Sprint 2 videos are recorded.
- [ ] A release tag is created on main (for example `v1.0-sprint2`).
