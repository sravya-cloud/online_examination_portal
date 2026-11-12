# Browser Compatibility Check (NFR-08)

Requirement: core flows work on the latest desktop Chrome, Edge and Firefox (VAL-N08).

## How to test
1. Start the server and client (see the README).
2. Run every flow below in each browser, using the latest version.
3. Mark Pass or Fail and note any problem.

## Flows (add rows as features are merged)

| Flow | Chrome | Edge | Firefox | Notes |
|---|---|---|---|---|
| Open login page, switch between Student / Teacher / Administrator tabs | | | | |
| Student login with correct details reaches the student dashboard | | | | |
| Teacher login reaches the teacher dashboard | | | | |
| Administrator login reaches the admin dashboard | | | | |
| Wrong password shows one generic error message | | | | |
| Logging in through the wrong portal is refused | | | | |
| Log out returns to the login page | | | | |
| Refreshing the page keeps the session; closing the tab ends it | | | | |

Browser versions tested: Chrome ____  Edge ____  Firefox ____   Date: ____  Tester: ____

## Notes
- The client is built with Vite, which targets current browsers. No browser-specific code is used.
- Record any failure as a GitHub issue and link it here.
