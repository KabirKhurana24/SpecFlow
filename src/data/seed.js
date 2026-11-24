export const seedProject = {
  project: {
    id: 'PRJ-ONB-001',
    name: 'Customer Onboarding Modernisation',
    client: 'Northstar Retail Bank',
    objective: 'Reduce onboarding friction while improving identity assurance and operational visibility.',
    sponsor: 'Head of Digital Channels',
    owner: 'Maya Chen',
    phase: 'Discovery & definition',
    startDate: '2026-10-05',
    targetDate: '2027-02-26'
  },
  sources: [
    {
      id: 'SRC-101',
      title: 'Stakeholder workshop — onboarding pain points',
      type: 'Workshop notes',
      owner: 'Maya Chen',
      createdAt: '2026-11-18T09:30:00.000Z',
      content: `Workshop notes — Customer onboarding\n\nCustomers need to complete a digital application without visiting a branch. The system must validate identity documents before an application can move to review. Applicants should be able to save a partially completed application and return later.\n\nOperations users need to see why an application was referred for manual review. The platform must notify applicants when additional information is required. A reviewer should be able to request a corrected document and record a reason.\n\nThe service should provide an audit trail of status changes and reviewer decisions. The application must prevent duplicate submissions for the same customer and product.\n\nCurrent pain points: customers repeat information, document status is unclear, and operations teams use spreadsheets to track exceptions.`
    },
    {
      id: 'SRC-102',
      title: 'Product owner follow-up — service expectations',
      type: 'Email summary',
      owner: 'Jordan Patel',
      createdAt: '2026-11-19T13:15:00.000Z',
      content: `Product owner follow-up\n\nThe experience should be usable on mobile and desktop. Customers must receive a confirmation reference after successful submission. Operations managers need a queue view with filters for age, risk status and assigned reviewer.\n\nThe solution must retain application events for audit and investigation. The business wants to measure completion rate, time to decision and the percentage of applications sent to manual review.`
    }
  ],
  requirements: [
    {
      id: 'REQ-001', title: 'Save and resume an application', description: 'Applicants must be able to save a partially completed digital application and resume it later without re-entering previously provided information.', category: 'Functional', priority: 'High', status: 'In review', owner: 'Maya Chen', sourceIds: ['SRC-101'], rationale: 'Reduces abandonment caused by long forms and interrupted sessions.', createdAt: '2026-11-18T10:00:00.000Z', updatedAt: '2026-11-20T11:00:00.000Z', acceptanceCriteria: ['Given an applicant has entered valid information, when they save the application, then the application is stored as Draft.', 'Given an applicant returns to a saved draft, when they reopen it, then previously saved fields are pre-populated.', 'Given a draft has expired under the retention policy, when the applicant opens it, then the system explains the next step.'], review: { reviewer: 'Jordan Patel', comment: 'Confirm the draft retention period with Compliance.', submittedAt: '2026-11-20T11:00:00.000Z' }
    },
    {
      id: 'REQ-002', title: 'Validate identity documents', description: 'The platform must validate the presence and basic quality of required identity documents before an application can move to the review stage.', category: 'Functional', priority: 'Critical', status: 'Approved', owner: 'Arjun Rao', sourceIds: ['SRC-101'], rationale: 'Prevents incomplete applications from entering the operations queue.', createdAt: '2026-11-18T10:15:00.000Z', updatedAt: '2026-11-21T09:20:00.000Z', acceptanceCriteria: ['Given a required document is missing, when the applicant attempts to continue, then the system identifies the missing document.', 'Given an uploaded document is unreadable or unsupported, when validation runs, then the applicant receives a corrective message.', 'Given all required documents pass basic checks, when the applicant continues, then the application can enter review.'], review: { reviewer: 'Jordan Patel', comment: 'Approved for prototype scope.', submittedAt: '2026-11-19T12:00:00.000Z', decidedAt: '2026-11-21T09:20:00.000Z' }
    },
    {
      id: 'REQ-003', title: 'Explain manual-review referrals', description: 'Operations users must be able to view the reason an application was referred for manual review and the evidence associated with the referral.', category: 'Functional', priority: 'High', status: 'Proposed', owner: 'Maya Chen', sourceIds: ['SRC-101'], rationale: 'Improves transparency and reduces investigation time.', createdAt: '2026-11-18T10:25:00.000Z', updatedAt: '2026-11-18T10:25:00.000Z', acceptanceCriteria: ['Given an application is referred, when an operations user opens it, then the referral reason is visible.', 'Given supporting evidence exists, when the user opens the referral, then the evidence is accessible subject to permissions.']
    },
    {
      id: 'REQ-004', title: 'Notify applicants of information requests', description: 'The platform must notify applicants when an operations reviewer requests additional or corrected information.', category: 'Functional', priority: 'Medium', status: 'Proposed', owner: 'Jordan Patel', sourceIds: ['SRC-101'], rationale: 'Reduces avoidable follow-up calls and makes next steps clear.', createdAt: '2026-11-18T10:30:00.000Z', updatedAt: '2026-11-18T10:30:00.000Z', acceptanceCriteria: ['Given a reviewer requests more information, when the request is saved, then the applicant receives a notification.', 'Given the applicant opens the notification, then it directs them to the relevant application and missing information.']
    },
    {
      id: 'REQ-005', title: 'Maintain an application audit trail', description: 'The solution must retain a time-stamped audit trail of application status changes and reviewer decisions.', category: 'Non-functional', priority: 'Critical', status: 'Approved', owner: 'Arjun Rao', sourceIds: ['SRC-101', 'SRC-102'], rationale: 'Supports investigation, control evidence and accountability.', createdAt: '2026-11-19T08:00:00.000Z', updatedAt: '2026-11-21T10:00:00.000Z', acceptanceCriteria: ['Given an application status changes, when the change is committed, then the actor, timestamp and previous and new status are recorded.', 'Given a reviewer records a decision, when the decision is saved, then the decision and reason are retained.', 'Given an authorised auditor requests history, then the event history can be viewed.'], review: { reviewer: 'Jordan Patel', comment: 'Approved; retention specifics remain subject to policy confirmation.', submittedAt: '2026-11-20T14:00:00.000Z', decidedAt: '2026-11-21T10:00:00.000Z' }
    },
    {
      id: 'REQ-006', title: 'Prevent duplicate submissions', description: 'The application must detect a duplicate submission for the same customer and product and guide the applicant to the existing application.', category: 'Functional', priority: 'High', status: 'Proposed', owner: 'Maya Chen', sourceIds: ['SRC-101'], rationale: 'Avoids duplicate work and conflicting records.', createdAt: '2026-11-19T08:30:00.000Z', updatedAt: '2026-11-19T08:30:00.000Z', acceptanceCriteria: ['Given an active application exists for the same customer and product, when a new submission is attempted, then the system flags the potential duplicate.', 'Given a duplicate is confirmed, then the applicant is directed to the existing application.']
    },
    {
      id: 'REQ-007', title: 'Provide an operations work queue', description: 'Operations managers need a queue view with filters for application age, risk status and assigned reviewer.', category: 'Functional', priority: 'Medium', status: 'Proposed', owner: 'Jordan Patel', sourceIds: ['SRC-102'], rationale: 'Improves workload visibility and allocation.', createdAt: '2026-11-19T09:00:00.000Z', updatedAt: '2026-11-19T09:00:00.000Z', acceptanceCriteria: ['Given an operations manager opens the queue, then applications are listed with age, risk and assigned reviewer.', 'Given a filter is selected, then only matching applications are displayed.']
    }
  ],
  stories: [
    { id: 'US-001', requirementId: 'REQ-001', title: 'Resume an in-progress application', asA: 'returning applicant', iWant: 'to resume my saved application', soThat: 'I can complete onboarding without repeating information', status: 'In progress', owner: 'Arjun Rao', points: 5, acceptanceCriteria: ['Drafts are saved when the applicant selects Save and continue later.', 'Reopening a draft pre-populates saved fields.', 'The applicant can see the last saved date and time.'] },
    { id: 'US-002', requirementId: 'REQ-002', title: 'Check identity document completeness', asA: 'applicant', iWant: 'to know whether my identity documents meet the submission requirements', soThat: 'I can correct issues before review', status: 'Ready', owner: 'Maya Chen', points: 3, acceptanceCriteria: ['Missing required documents are identified.', 'Unsupported file types are rejected with guidance.', 'The application progresses only when required documents pass basic checks.'] },
    { id: 'US-003', requirementId: 'REQ-005', title: 'View application event history', asA: 'authorised operations user', iWant: 'to view a time-stamped history of status changes and decisions', soThat: 'I can investigate an application and evidence its handling', status: 'Backlog', owner: 'Arjun Rao', points: 5, acceptanceCriteria: ['Each status change records actor, timestamp and old/new values.', 'Reviewer decisions include a reason.', 'History is restricted to authorised users.'] }
  ],
  tests: [
    { id: 'TC-001', requirementId: 'REQ-001', storyId: 'US-001', title: 'Saved draft restores previously entered fields', type: 'Functional', status: 'Draft', steps: ['Create a new application.', 'Enter values in at least three fields.', 'Save and close the application.', 'Reopen the saved draft.'], expected: 'Previously saved values are displayed in their corresponding fields.' },
    { id: 'TC-002', requirementId: 'REQ-002', storyId: 'US-002', title: 'Missing identity document blocks progression', type: 'Negative', status: 'Ready', steps: ['Start an application.', 'Leave one required identity document empty.', 'Attempt to continue.'], expected: 'The system identifies the missing document and prevents progression.' },
    { id: 'TC-003', requirementId: 'REQ-005', storyId: 'US-003', title: 'Status history records actor and timestamp', type: 'Audit', status: 'Draft', steps: ['Open an application as an authorised user.', 'Change its status.', 'Open event history.'], expected: 'The event shows the actor, timestamp, previous status and new status.' },
    { id: 'TC-004', requirementId: 'REQ-003', storyId: '', title: 'Referral reason is visible to operations', type: 'Functional', status: 'Draft', steps: ['Open an application referred for manual review.', 'Inspect the referral details.'], expected: 'The referral reason is visible to an authorised operations user.' }
  ],
  activity: [
    { id: 'ACT-01', text: 'Jordan Patel approved REQ-005', time: '2026-11-21T10:00:00.000Z', type: 'approved' },
    { id: 'ACT-02', text: 'REQ-001 submitted for review', time: '2026-11-20T11:00:00.000Z', type: 'review' },
    { id: 'ACT-03', text: 'Workshop notes added to Discovery Inbox', time: '2026-11-18T09:30:00.000Z', type: 'source' }
  ]
};
