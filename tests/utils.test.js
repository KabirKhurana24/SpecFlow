import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBrd, draftStory, extractCandidateRequirements, makeCsv } from '../src/utils.js';
import { seedProject } from '../src/data/seed.js';

test('extractCandidateRequirements identifies requirement-like statements and skips duplicates', () => {
  const source = 'The platform must retain an audit trail of application changes. Customers need to save a draft application and return later. This is a general statement with no requirement language.';
  const result = extractCandidateRequirements(source, ['Retain an audit trail']);
  assert.equal(result.length, 1);
  assert.match(result[0].description, /save a draft application/i);
  assert.equal(result[0].category, 'Functional');
});

test('draftStory creates a structured story from a requirement', () => {
  const story = draftStory({ title: 'Notify applicants of missing information', description: 'Applicants must receive a notification.', rationale: 'Reduces avoidable follow-up calls.', acceptanceCriteria: ['A notification is sent.'] });
  assert.equal(story.asA, 'applicant');
  assert.match(story.iWant, /notify applicants/i);
  assert.equal(story.acceptanceCriteria.length, 1);
});

test('BRD export includes requirements, stories and test cases', () => {
  const brd = buildBrd(seedProject);
  assert.match(brd, /Business Requirements Document/);
  assert.match(brd, /REQ-001/);
  assert.match(brd, /US-001/);
  assert.match(brd, /TC-001/);
});

test('CSV export escapes cells containing commas and quotes', () => {
  const csv = makeCsv([{ id: 'REQ-1', title: 'Name, address', description: 'Say "hello"', category: 'Functional', priority: 'High', status: 'Proposed', owner: 'Maya', sourceIds: [] }]);
  assert.match(csv, /"Name, address"/);
  assert.match(csv, /"Say ""hello"""/);
});
