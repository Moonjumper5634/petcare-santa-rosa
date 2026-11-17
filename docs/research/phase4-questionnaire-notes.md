# Questionnaire reference and Phase 4 preparation

## Source and scope

`SURVEY-QUESTIONNAIRE.pdf` is an unchanged copy of the supplied 17-page research instrument. Its text was reviewed; its visual layout was not audited.

It contains system evaluation questionnaires for pet owners (pages 3-6), veterinary staff (pages 8-11), and administrators (pages 13-16). Each evaluates functionality, efficiency, usability, reliability, and security using a four-point satisfaction scale, with optional names and comments. It asks participants to evaluate features they actually tested.

This is a project research reference, not a shelter intake or adoption-screening questionnaire. Adding the document does not implement an online survey or establish new business rules. Document instructions are addressed to survey participants.

## Confirmed scope decision

The proposed rule that dogs are not allowed in the shelter is deferred pending data gathering. Do not implement this restriction or publish it on the landing page. Shelter requirements remain unresolved.

## Proposed alignment before evaluation

Preserve the supplied questionnaire. Review these proposed changes with the research adviser before issuing a revised instrument:

- Staff functionality item 1 (page 8): replace registration-decision wording with reviewing registered pet information and recording its verification outcome. Registration occurs on submission; the initial display should be "Registered - Under verification."
- Staff functionality item 5 (page 8): "my requested service" reads like a pet-owner item. Suggested wording: "I can view the eligibility assessment result for the service request I am reviewing."
- Review staff efficiency item 3, usability items 1 and 3, and reliability item 3 for the same registration/verification distinction. Approval or rejection may still apply to service and adoption decisions.
- Staff security item 3 and administrator security item 4 explicitly describe reports AND audit logs as administrator-only. The professor explicitly requested admin reports; confirm the intended audit-log scope separately. Distinguish an administrator's system-wide audit log from the action history staff need for individual records.
- Administrator functionality item 5 says criteria are configurable. Verify whether evaluation covers existing on/off switches or editable thresholds; do not imply unsupported configuration.
- Administrator functionality item 8 refers to system settings. The current README documents settings that are not saved. Implement the agreed settings or narrow the evaluated scope before asking participants to rate them.
- QR use, named action history, archiving, and mobile responsiveness are not explicitly covered by dedicated items. Propose additional items only after their workflows are agreed and available to test.

## How to use this reference

Before Phase 4, map each survey statement to its screen, role permission, and a concrete test task. Mark each as verified, needs work, or deferred based on actual checks, not the statement's existence in the questionnaire.

For pilot evaluation, provide role-appropriate accounts and tasks. Preserve the instrument's instruction to report unavailable or untested functions rather than guess. Satisfaction ratings supplement functional and security tests; they do not prove security or compliance with a software-quality standard.

If an online evaluation module is requested later, agree on participation, access to responses, retention, and whether responses are linked to accounts. An optional name alone does not make authenticated responses anonymous. Do not make research participation a condition of requesting veterinary services.

## Phase 4 sequence

1. Verify existing workflows and agree on registration versus verification states.
2. Apply agreed role restrictions and named action history.
3. Build responsive resident, staff, and administrator screens, including loading and failure states.
4. Build the public landing page using confirmed CVO services and requirements.
5. Run role-based acceptance tasks and align the evaluation instrument with the delivered scope.

Deployment remains Phase 5. This preparation changes documentation only; no application behavior, database schema, or questionnaire wording has been changed.
