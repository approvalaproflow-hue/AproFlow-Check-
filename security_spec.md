# Security Specification

## 1. Data Invariants Summary
- A RequestForm must have a valid `userId` matching the authenticated sender, and its `enterpriseCode` must match the sender's `enterpriseCode` to prevent multi-company cross-talk.
- Users cannot modify or promote their own `role` or `isAdmin` fields, preventing self-escalated administrative privileges.
- Audit logs are system-write only (created during actions) and are completely immutable once written.
- Emails and sensitive fields belong exclusively to the resource owner or system administrators.

## 2. The "Dirty Dozen" Rogue Payloads
Below are 12 specific payloads designed to challenge rules covering identity alignment, company isolation, status shortcutting, and ID poisoning:

1. **Self-Promote Admin Privilege**: An employee tries to update their own document `role` to 'admin'.
2. **Cross-Company Query Peek**: An employee tries to list/get another company's request forms.
3. **Spoof Author ID**: An employee tries to submit a request under a different employee's `userId`.
4. **Mutate Immutable CreatedAt**: Modifying the `submissionDate` or `createdAt` of a request post-facto.
5. **ID Poisoning Attack**: Submitting a request document under a garbage 2KB document ID.
6. **Bypass State Machine**: Promoting a request from "Draft" directly to "Approved" as an employee.
7. **Illicit Decisive Action**: An employee trying to call approval decision `/review` or modifying `approvalDetails`.
8. **Malicious Notification Injection**: An employee writing a notification directly to an administrator's collection.
9. **Rogue Audit Log Erasure**: Attempting to delete history in `/auditLogs/`.
10. **Disable Administrative Account**: Attempting to set an administrator's state to 'inactive'.
11. **Inject Spoofed Verified Email Claims**: Authenticating without verification and accessing sensitive fields.
12. **Bypass Relational Integrity**: Submitting a request with an invalid/not-found `enterpriseCode`.

## 3. Test Runner Design (`firestore.rules.test.ts`)
A standard test script running in the sandbox environment to execute these tests against Local rules, verifying that all return `PERMISSION_DENIED`.
