export const STORAGE_KEY = 'specflow-workspace-v1';

export function makeId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function loadWorkspace(seed) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.project && Array.isArray(parsed.requirements)) return parsed;
    }
  } catch (error) {
    console.warn('Could not load saved SPECFLOW workspace:', error);
  }
  return structuredClone(seed);
}

export function saveWorkspace(workspace) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    return true;
  } catch (error) {
    console.warn('Could not save SPECFLOW workspace:', error);
    return false;
  }
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function timeAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const days = Math.round((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(value);
}

export function downloadFile(filename, contents, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const ACTION_VERBS = /\b(must|shall|should|need to|needs to|required to|requires|has to|will be able to)\b/i;
const REQUIREMENT_CONTEXT = /\b(system|platform|application|applicant|customer|user|reviewer|manager|operations|service|solution|the bank|auditor|employee)\b/i;

export function extractCandidateRequirements(content, existingTitles = []) {
  const sentences = String(content || '')
    .replace(/\r/g, '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((s) => s.length >= 28 && ACTION_VERBS.test(s) && REQUIREMENT_CONTEXT.test(s));

  const seen = existingTitles.map((title) => title.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim());
  return sentences.map((sentence, index) => {
    const normalised = sentence.replace(/[.!?]+$/, '');
    const title = deriveTitle(normalised);
    const candidateKey = title.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const duplicate = seen.some((existing) => existing === candidateKey || existing.includes(candidateKey) || candidateKey.includes(existing) || tokenOverlap(existing, candidateKey) >= 0.72);
    seen.push(candidateKey);
    return {
      id: makeId('CAND'),
      title,
      description: normalised.endsWith('.') ? normalised : `${normalised}.`,
      category: /audit|retention|security|availability|performance|accessibility/i.test(sentence) ? 'Non-functional' : 'Functional',
      priority: /must|shall|required/i.test(sentence) ? 'High' : 'Medium',
      confidence: /must|shall|required/i.test(sentence) ? 'High' : 'Medium',
      duplicate,
      sourceExcerpt: sentence,
      sequence: index + 1
    };
  }).filter((item) => !item.duplicate);
}

function tokenOverlap(a, b) {
  const aTokens = new Set(a.split(/\s+/).filter((word) => word.length > 2));
  const bTokens = new Set(b.split(/\s+/).filter((word) => word.length > 2));
  if (!aTokens.size || !bTokens.size) return 0;
  const shared = [...aTokens].filter((word) => bTokens.has(word)).length;
  return shared / Math.max(aTokens.size, bTokens.size);
}

export function deriveTitle(sentence) {
  const text = sentence
    .replace(/^.*?\b(must|shall|should|need to|needs to|required to|requires|has to|will be able to)\b\s*/i, '')
    .replace(/^(the |a |an )/i, '')
    .replace(/[.!?]+$/, '')
    .trim();
  const concise = text.split(/\s+(?:before|when|so that|in order to|to ensure|while)\s+/i)[0];
  const words = concise.split(/\s+/).slice(0, 7).join(' ');
  return (words || sentence).charAt(0).toUpperCase() + (words || sentence).slice(1);
}

export function draftStory(requirement) {
  const description = requirement.description || requirement.title;
  const actor = /applicant|customer/i.test(description) ? 'applicant' : /operations|reviewer|manager/i.test(description) ? 'operations user' : 'user';
  const action = requirement.title.charAt(0).toLowerCase() + requirement.title.slice(1);
  const outcome = requirement.rationale || 'complete the task accurately and efficiently';
  const clauses = (requirement.acceptanceCriteria || []).filter(Boolean);
  return {
    title: requirement.title,
    asA: actor,
    iWant: `to ${action.replace(/^to /, '')}`,
    soThat: outcome.charAt(0).toLowerCase() + outcome.slice(1),
    acceptanceCriteria: clauses.length ? [...clauses] : [
      `Given the user has the required access, when they complete the relevant action, then the system records the result.`,
      `Given the action cannot be completed, when an error occurs, then the system provides a clear next step.`
    ]
  };
}

export function buildBrd(workspace) {
  const { project, requirements, stories, tests, sources } = workspace;
  const lines = [
    `# Business Requirements Document — ${project.name}`,
    '',
    `**Client:** ${project.client || 'Not specified'}  `,
    `**Project owner:** ${project.owner || 'Not specified'}  `,
    `**Sponsor:** ${project.sponsor || 'Not specified'}  `,
    `**Objective:** ${project.objective || 'Not specified'}`,
    '',
    '> Prototype export. Confirm policy, legal, security, operational and technical constraints with accountable stakeholders before treating this as an approved baseline.',
    '',
    '## 1. Scope and requirements', ''
  ];
  requirements.forEach((r) => {
    lines.push(`### ${r.id} — ${r.title}`, '', `- **Status:** ${r.status}`,
      `- **Priority:** ${r.priority}`, `- **Category:** ${r.category}`, `- **Owner:** ${r.owner || 'Unassigned'}`,
      '', r.description, '', '**Acceptance criteria**',
      ...(r.acceptanceCriteria || []).map((a, i) => `${i + 1}. ${a}`), '',
      `**Source(s):** ${(r.sourceIds || []).map((id) => sources.find((s) => s.id === id)?.title || id).join('; ') || 'Not linked'}`, '');
  });
  lines.push('## 2. User stories', '');
  stories.forEach((s) => lines.push(`### ${s.id} — ${s.title}`, '', `As a ${s.asA}, I want ${s.iWant}, so that ${s.soThat}.`, '',
    ...(s.acceptanceCriteria || []).map((a, i) => `${i + 1}. ${a}`), ''));
  lines.push('## 3. Test coverage', '');
  tests.forEach((t) => lines.push(`### ${t.id} — ${t.title}`, '', `- Requirement: ${t.requirementId}`, `- Story: ${t.storyId || 'Not linked'}`, `- Status: ${t.status}`, `- Expected result: ${t.expected}`, ''));
  lines.push('## 4. Open decisions', '', ...requirements.filter((r) => r.status !== 'Approved').map((r) => `- ${r.id}: ${r.title} — ${r.status}`));
  return lines.join('\n');
}

export function makeCsv(requirements) {
  const headers = ['ID', 'Title', 'Description', 'Category', 'Priority', 'Status', 'Owner', 'Source IDs'];
  const rows = requirements.map((r) => [r.id, r.title, r.description, r.category, r.priority, r.status, r.owner, (r.sourceIds || []).join(';')]);
  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
}
