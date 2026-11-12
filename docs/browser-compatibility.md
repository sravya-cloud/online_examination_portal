# Browser Compatibility Check (NFR-08)

Requirement: core flows work on the latest desktop Chrome, Edge and Firefox (VAL-N08).

## How to test
1. Start the server and client (see the README).
2. Run every flow below in each browser, using the latest version.
3. Mark Pass or Fail and note any problem.

## Flows (add rows as features are merged)

| Flow | Chrome | Edge | Firefox | Notes |
|---|---|---|---|---|
| Open login page, switch between Student / Teacher / Administrator tabs | Pass | Pass | Pass | |
| Student login with correct details reaches the student dashboard | Pass | Pass | Pass | |
| Teacher login reaches the teacher dashboard | Pass | Pass | Pass | |
| Administrator login reaches the admin dashboard | Pass | Pass | Pass | |
| Wrong password shows one generic error message | Pass | Pass | Pass | |
| Logging in through the wrong portal is refused | Pass | Pass | Pass | |
| Log out returns to the login page | Pass | Pass | Pass | |
| Refreshing the page keeps the session; closing the tab ends it | Pass | Pass | Pass | |

Browser versions tested: Chrome 157 (latest stable), Edge (latest stable), Firefox (latest stable)   Date: 12-11-2026   Tester: Sravya

## Notes
- The client is built with Vite, which targets current browsers. No browser-specific code is used.
- Record any failure as a GitHub issue and link it here.
