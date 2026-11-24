# Manual acceptance test checklist

Use the seeded Customer Onboarding Modernisation workspace.

1. **Discovery intake:** Open Discovery Inbox, add a source, enter at least two sentences containing “must” or “should”, and save it. Confirm it appears in the source library.
2. **Candidate extraction:** Select the source and run “Find candidate requirements”. Confirm the extracted candidates show the source text and confidence label. Add one candidate to the register.
3. **Requirement maintenance:** Open Requirements, select the new requirement, edit its title, priority, owner and acceptance criteria, then save. Refresh the page and confirm the changes remain.
4. **Story drafting:** Use “Draft user story” on a requirement. Confirm the story is linked to the originating requirement. Edit the user-story statement and acceptance criteria, then save.
5. **Test linkage:** Open Traceability, add a test case against the requirement, and confirm the requirement shows test coverage.
6. **Review workflow:** Submit a proposed requirement for review. Open Reviews and approve it. Confirm the decision appears in the decision history and the requirement status changes.
7. **Change impact:** Open Change impact and choose the requirement. Confirm linked source material, stories and tests are displayed.
8. **Export:** Export the BRD, CSV and project JSON. Confirm the files download and contain the current project data.
9. **New project:** Open project settings and create a separate project. Confirm the new project starts with empty data.

## Expected prototype limitations

- Data is stored in the current browser's local storage. No multi-user synchronization is implemented.
- Discovery extraction is rules-based and may miss valid requirements or produce false positives.
- File intake supports `.txt`, `.md` and `.csv` only. PDF, DOCX and scanned document extraction are not implemented.
- Approval decisions are local records and do not send emails or notifications.
