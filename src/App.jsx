import React, { useEffect, useMemo, useState } from 'react';
import { seedProject } from './data/seed.js';
import {
  buildBrd, downloadFile, draftStory, escapeCsv, extractCandidateRequirements,
  formatDate, loadWorkspace, makeCsv, makeId, saveWorkspace, timeAgo
} from './utils.js';

const NAV = [
  { id: 'workspace', label: 'Workspace', icon: '⌂', group: 'WORKSPACE' },
  { id: 'discovery', label: 'Discovery inbox', icon: '▤', group: 'WORKSPACE' },
  { id: 'requirements', label: 'Requirements', icon: '☷', group: 'DELIVERY' },
  { id: 'stories', label: 'Stories & criteria', icon: '◫', group: 'DELIVERY' },
  { id: 'traceability', label: 'Traceability', icon: '⌘', group: 'DELIVERY' },
  { id: 'reviews', label: 'Reviews', icon: '◎', group: 'GOVERNANCE' },
  { id: 'impact', label: 'Change impact', icon: '↗', group: 'GOVERNANCE' },
  { id: 'exports', label: 'Documents & exports', icon: '⇩', group: 'GOVERNANCE' }
];

function Badge({ children, tone = 'neutral' }) { return <span className={`badge badge-${tone}`}>{children}</span>; }
function Button({ children, variant = 'primary', size = '', onClick, disabled, title, type = 'button' }) {
  return <button type={type} title={title} disabled={disabled} className={`btn btn-${variant} ${size ? `btn-${size}` : ''}`} onClick={onClick}>{children}</button>;
}
function Field({ label, children, hint }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}
function EmptyState({ icon = '✦', title, text, action }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p>{action}</div>;
}
function SectionHeader({ eyebrow, title, description, actions }) {
  return <div className="section-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><div className="header-actions">{actions}</div></div>;
}
function Stat({ label, value, note, accent = '' }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-dot ${accent}`}></span></div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>;
}
function Avatar({ name, small = false }) {
  const initials = String(name || 'Unassigned').split(' ').map((v) => v[0]).join('').slice(0, 2).toUpperCase();
  return <span className={`avatar ${small ? 'avatar-small' : ''}`}>{initials}</span>;
}
function App() {
  const [workspace, setWorkspace] = useState(() => loadWorkspace(seedProject));
  const [activeView, setActiveView] = useState('workspace');
  const [selectedSourceId, setSelectedSourceId] = useState(workspace.sources[0]?.id || '');
  const [selectedRequirementId, setSelectedRequirementId] = useState(workspace.requirements[0]?.id || '');
  const [selectedStoryId, setSelectedStoryId] = useState(workspace.stories[0]?.id || '');
  const [candidateRequirements, setCandidateRequirements] = useState([]);
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [sourceType, setSourceType] = useState('Workshop notes');
  const [requirementQuery, setRequirementQuery] = useState('');
  const [requirementFilter, setRequirementFilter] = useState('All');
  const [storyQuery, setStoryQuery] = useState('');
  const [impactRequirementId, setImpactRequirementId] = useState(workspace.requirements[0]?.id || '');
  const [toast, setToast] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewSource, setShowNewSource] = useState(false);
  const [showNewRequirement, setShowNewRequirement] = useState(false);
  const [showNewTest, setShowNewTest] = useState(false);
  const [testForRequirement, setTestForRequirement] = useState('');
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [saving, setSaving] = useState(true);

  useEffect(() => {
    const ok = saveWorkspace(workspace);
    setSaving(ok);
  }, [workspace]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const currentSource = workspace.sources.find((s) => s.id === selectedSourceId) || workspace.sources[0];
  const selectedRequirement = workspace.requirements.find((r) => r.id === selectedRequirementId) || workspace.requirements[0];
  const selectedStory = workspace.stories.find((s) => s.id === selectedStoryId) || workspace.stories[0];
  const pendingReviews = workspace.requirements.filter((r) => r.status === 'In review');
  const approvedCount = workspace.requirements.filter((r) => r.status === 'Approved').length;
  const linkedReqCount = workspace.requirements.filter((r) => workspace.stories.some((s) => s.requirementId === r.id)).length;
  const coverage = workspace.requirements.length ? Math.round((workspace.requirements.filter((r) => workspace.tests.some((t) => t.requirementId === r.id)).length / workspace.requirements.length) * 100) : 0;

  const updateWorkspace = (patch) => setWorkspace((prev) => ({ ...prev, ...patch }));
  const addActivity = (text, type = 'update') => setWorkspace((prev) => ({ ...prev, activity: [{ id: makeId('ACT'), text, type, time: new Date().toISOString() }, ...(prev.activity || [])].slice(0, 30) }));
  const updateRequirement = (id, patch) => setWorkspace((prev) => ({ ...prev, requirements: prev.requirements.map((r) => r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r) }));
  const updateStory = (id, patch) => setWorkspace((prev) => ({ ...prev, stories: prev.stories.map((s) => s.id === id ? { ...s, ...patch } : s) }));

  const filteredRequirements = useMemo(() => workspace.requirements.filter((r) => {
    const query = requirementQuery.toLowerCase();
    const matchesQuery = !query || `${r.id} ${r.title} ${r.description} ${r.owner}`.toLowerCase().includes(query);
    const matchesFilter = requirementFilter === 'All' || r.status === requirementFilter || r.priority === requirementFilter;
    return matchesQuery && matchesFilter;
  }), [workspace.requirements, requirementQuery, requirementFilter]);

  const notify = (message) => setToast(message);

  const handleAddSource = (event) => {
    event.preventDefault();
    if (!sourceTitle.trim() || !sourceText.trim()) return;
    const source = { id: makeId('SRC'), title: sourceTitle.trim(), type: sourceType, owner: 'You', createdAt: new Date().toISOString(), content: sourceText.trim() };
    setWorkspace((prev) => ({ ...prev, sources: [source, ...prev.sources] }));
    setSelectedSourceId(source.id);
    setCandidateRequirements([]);
    setShowNewSource(false);
    setSourceTitle(''); setSourceText('');
    addActivity(`Added discovery source “${source.title}”`, 'source');
    setActiveView('discovery');
    notify('Source added to the discovery inbox');
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const extension = file.name.split('.').pop().toLowerCase();
    if (!['txt', 'md', 'csv'].includes(extension)) {
      notify('For this prototype, upload a .txt, .md or .csv file');
      return;
    }
    const text = await file.text();
    setSourceTitle(file.name.replace(/\.[^.]+$/, ''));
    setSourceText(text);
    setSourceType(extension === 'csv' ? 'Data / CSV' : 'Uploaded document');
    setShowNewSource(true);
  };

  const runExtraction = () => {
    if (!currentSource) return;
    const candidates = extractCandidateRequirements(currentSource.content, workspace.requirements.map((r) => r.title));
    setCandidateRequirements(candidates.map((c) => ({ ...c, sourceId: currentSource.id })));
    notify(`${candidates.length} candidate requirement${candidates.length === 1 ? '' : 's'} found`);
  };

  const addCandidate = (candidate) => {
    const req = {
      id: makeId('REQ'), title: candidate.title, description: candidate.description,
      category: candidate.category, priority: candidate.priority, status: 'Proposed', owner: 'Unassigned',
      sourceIds: [candidate.sourceId], rationale: 'Captured from discovery material; confirm with the requirement owner.',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      acceptanceCriteria: ['Given the relevant user and preconditions, when the capability is used, then the expected outcome is achieved.']
    };
    setWorkspace((prev) => ({ ...prev, requirements: [req, ...prev.requirements] }));
    setSelectedRequirementId(req.id);
    setCandidateRequirements((prev) => prev.filter((c) => c.id !== candidate.id));
    addActivity(`Created ${req.id} from ${currentSource?.title || 'discovery source'}`, 'requirement');
    notify(`${req.id} added to the requirement register`);
  };

  const addAllCandidates = () => {
    const candidates = [...candidateRequirements];
    if (!candidates.length) return;
    const newReqs = candidates.map((candidate) => ({
      id: makeId('REQ'), title: candidate.title, description: candidate.description,
      category: candidate.category, priority: candidate.priority, status: 'Proposed', owner: 'Unassigned',
      sourceIds: [candidate.sourceId], rationale: 'Captured from discovery material; confirm with the requirement owner.',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      acceptanceCriteria: ['Given the relevant user and preconditions, when the capability is used, then the expected outcome is achieved.']
    }));
    setWorkspace((prev) => ({ ...prev, requirements: [...newReqs, ...prev.requirements] }));
    setSelectedRequirementId(newReqs[0].id);
    setCandidateRequirements([]);
    addActivity(`Added ${newReqs.length} requirements from discovery material`, 'requirement');
    notify(`${newReqs.length} requirements added to the register`);
  };

  const createRequirement = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const req = {
      id: makeId('REQ'), title: form.get('title').trim(), description: form.get('description').trim(),
      category: form.get('category'), priority: form.get('priority'), status: 'Proposed', owner: form.get('owner') || 'Unassigned',
      sourceIds: currentSource ? [currentSource.id] : [], rationale: form.get('rationale') || '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), acceptanceCriteria: ['Given the relevant user and preconditions, when the capability is used, then the expected outcome is achieved.']
    };
    setWorkspace((prev) => ({ ...prev, requirements: [req, ...prev.requirements] }));
    setSelectedRequirementId(req.id); setShowNewRequirement(false); setActiveView('requirements');
    addActivity(`Created ${req.id}: ${req.title}`, 'requirement'); notify('Requirement created');
  };

  const createStoryForRequirement = (requirement) => {
    if (!requirement) return;
    const drafted = draftStory(requirement);
    const story = { id: makeId('US'), requirementId: requirement.id, ...drafted, status: 'Backlog', owner: requirement.owner || 'Unassigned', points: 3 };
    setWorkspace((prev) => ({ ...prev, stories: [story, ...prev.stories] }));
    setSelectedStoryId(story.id); setActiveView('stories');
    addActivity(`Drafted ${story.id} from ${requirement.id}`, 'story'); notify(`User story ${story.id} drafted`);
  };

  const submitForReview = (requirement) => {
    if (!requirement) return;
    updateRequirement(requirement.id, { status: 'In review', review: { reviewer: requirement.review?.reviewer || 'Jordan Patel', comment: requirement.review?.comment || '', submittedAt: new Date().toISOString() } });
    addActivity(`${requirement.id} submitted for review`, 'review'); notify('Requirement sent to the review queue');
  };

  const decideReview = (requirement, decision, comment = '') => {
    const label = decision === 'Approved' ? 'approved' : decision === 'Changes requested' ? 'requested changes on' : 'rejected';
    updateRequirement(requirement.id, { status: decision, review: { ...(requirement.review || {}), reviewer: requirement.review?.reviewer || 'Jordan Patel', comment: comment || requirement.review?.comment || '', decidedAt: new Date().toISOString() } });
    addActivity(`You ${label} ${requirement.id}`, decision === 'Approved' ? 'approved' : 'review');
    notify(`${requirement.id} marked ${decision.toLowerCase()}`);
  };

  const createTest = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reqId = form.get('requirementId');
    const test = { id: makeId('TC'), requirementId: reqId, storyId: form.get('storyId') || '', title: form.get('title').trim(), type: form.get('type'), status: 'Draft', steps: String(form.get('steps')).split('\n').map((s) => s.trim()).filter(Boolean), expected: form.get('expected').trim() };
    setWorkspace((prev) => ({ ...prev, tests: [test, ...prev.tests] }));
    setShowNewTest(false); addActivity(`Created ${test.id} for ${reqId}`, 'test'); notify('Test case linked to requirement');
  };

  const addStoryCriterion = () => {
    if (!selectedStory) return;
    updateStory(selectedStory.id, { acceptanceCriteria: [...(selectedStory.acceptanceCriteria || []), ''] });
  };
  const addRequirementCriterion = () => {
    if (!selectedRequirement) return;
    updateRequirement(selectedRequirement.id, { acceptanceCriteria: [...(selectedRequirement.acceptanceCriteria || []), ''] });
  };

  const renderView = () => {
    switch (activeView) {
      case 'discovery': return <DiscoveryView {...{ workspace, currentSource, selectedSourceId, setSelectedSourceId, candidateRequirements, setCandidateRequirements, runExtraction, addCandidate, addAllCandidates, setShowNewSource, handleUpload, notify }} />;
      case 'requirements': return <RequirementsView {...{ workspace, filteredRequirements, selectedRequirement, selectedRequirementId, setSelectedRequirementId, requirementQuery, setRequirementQuery, requirementFilter, setRequirementFilter, updateRequirement, createStoryForRequirement, submitForReview, addRequirementCriterion, setShowNewRequirement, notify }} />;
      case 'stories': return <StoriesView {...{ workspace, selectedStory, selectedStoryId, setSelectedStoryId, updateStory, storyQuery, setStoryQuery, addStoryCriterion, createStoryForRequirement, setActiveView }} />;
      case 'traceability': return <TraceabilityView {...{ workspace, setSelectedRequirementId, setSelectedStoryId, setActiveView, setShowNewTest, setTestForRequirement, notify }} />;
      case 'reviews': return <ReviewsView {...{ workspace, pendingReviews, decideReview: (r, d) => decideReview(r, d, reviewComment[r.id] || ''), setSelectedRequirementId, setActiveView }} />;
      case 'impact': return <ImpactView {...{ workspace, impactRequirementId, setImpactRequirementId, setSelectedRequirementId, setActiveView }} />;
      case 'exports': return <ExportsView {...{ workspace, notify }} />;
      default: return <WorkspaceView {...{ workspace, approvedCount, linkedReqCount, coverage, pendingReviews, setActiveView, setSelectedRequirementId, setShowNewRequirement, setShowNewSource }} />;
    }
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">S<span>.</span></div><div><div className="brand-name">SPECFLOW</div><div className="brand-sub">REQUIREMENTS STUDIO</div></div></div>
      <div className="project-switcher" onClick={() => setShowProjectSettings(true)} role="button" tabIndex="0">
        <div className="project-monogram">{workspace.project.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
        <div className="project-switcher-text"><strong>{workspace.project.name}</strong><span>{workspace.project.client}</span></div><span className="switch-chevron">⌄</span>
      </div>
      <nav className="nav-list">
        {['WORKSPACE', 'DELIVERY', 'GOVERNANCE'].map((group) => <div className="nav-group" key={group}><div className="nav-heading">{group}</div>
          {NAV.filter((n) => n.group === group).map((item) => <button key={item.id} className={`nav-item ${activeView === item.id ? 'active' : ''}`} onClick={() => setActiveView(item.id)}>
            <span className="nav-icon">{item.icon}</span><span>{item.label}</span>{item.id === 'reviews' && pendingReviews.length > 0 && <span className="nav-count">{pendingReviews.length}</span>}
          </button>)}
        </div>)}
      </nav>
      <div className="sidebar-bottom"><div className="storage-indicator"><span className="online-dot"></span><span>{saving ? 'Saved in this browser' : 'Local save unavailable'}</span></div><div className="user-profile"><Avatar name="Maya Chen"/><div><strong>Maya Chen</strong><span>Business Analyst</span></div><span className="more-dots">···</span></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span className="crumb-sep">/</span><strong>{NAV.find((n) => n.id === activeView)?.label || 'Workspace'}</strong></div><div className="topbar-right"><span className="autosave-label"><span className="online-dot"></span> Autosaved</span><button className="topbar-icon" title="Project settings" onClick={() => setShowProjectSettings(true)}>⚙</button><Avatar name="Maya Chen" small/></div></header>
      <div className="content-area">{renderView()}</div>
    </main>

    {showNewSource && <Modal title="Add discovery source" subtitle="Bring stakeholder input into the project workspace" onClose={() => setShowNewSource(false)}>
      <form onSubmit={handleAddSource} className="modal-form">
        <Field label="Source title"><input required value={sourceTitle} onChange={(e) => setSourceTitle(e.target.value)} placeholder="e.g. Operations workshop notes"/></Field>
        <Field label="Source type"><select value={sourceType} onChange={(e) => setSourceType(e.target.value)}><option>Workshop notes</option><option>Stakeholder interview</option><option>Email summary</option><option>Uploaded document</option><option>Data / CSV</option><option>Other</option></select></Field>
        <Field label="Source content" hint="Paste text here. The prototype extraction helper looks for requirement-like statements."><textarea required rows="8" value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="Paste meeting notes, stakeholder requests or business context…"/></Field>
        <div className="modal-actions"><Button variant="ghost" onClick={() => setShowNewSource(false)}>Cancel</Button><Button type="submit">Add source</Button></div>
      </form>
    </Modal>}

    {showNewRequirement && <Modal title="Create requirement" subtitle="Add a requirement directly to the project register" onClose={() => setShowNewRequirement(false)}>
      <form onSubmit={createRequirement} className="modal-form">
        <Field label="Requirement title"><input name="title" required placeholder="e.g. Show application status to applicants"/></Field>
        <Field label="Description"><textarea name="description" required rows="3" placeholder="Describe the expected capability or constraint…"/></Field>
        <div className="form-grid"><Field label="Category"><select name="category"><option>Functional</option><option>Non-functional</option><option>Business</option><option>Data</option></select></Field><Field label="Priority"><select name="priority"><option>Medium</option><option>High</option><option>Critical</option><option>Low</option></select></Field></div>
        <Field label="Owner"><input name="owner" placeholder="Unassigned"/></Field>
        <Field label="Business rationale"><textarea name="rationale" rows="2" placeholder="Why does this matter?"/></Field>
        <div className="modal-actions"><Button variant="ghost" onClick={() => setShowNewRequirement(false)}>Cancel</Button><Button type="submit">Create requirement</Button></div>
      </form>
    </Modal>}

    {showNewTest && <Modal title="Add test case" subtitle="Connect a verification scenario to a requirement" onClose={() => setShowNewTest(false)}>
      <form onSubmit={createTest} className="modal-form">
        <Field label="Requirement"><select name="requirementId" value={testForRequirement || workspace.requirements[0]?.id} onChange={(e) => setTestForRequirement(e.target.value)}>{workspace.requirements.map((r) => <option key={r.id} value={r.id}>{r.id} · {r.title}</option>)}</select></Field>
        <Field label="Related user story"><select name="storyId"><option value="">No linked story yet</option>{workspace.stories.filter((s) => s.requirementId === (testForRequirement || workspace.requirements[0]?.id)).map((s) => <option key={s.id} value={s.id}>{s.id} · {s.title}</option>)}</select></Field>
        <Field label="Test case title"><input name="title" required placeholder="e.g. Existing draft loads saved information"/></Field>
        <Field label="Test type"><select name="type"><option>Functional</option><option>Negative</option><option>Integration</option><option>Audit</option><option>Performance</option></select></Field>
        <Field label="Test steps" hint="Enter one step per line"><textarea name="steps" rows="4" required placeholder={'1. Open the application\n2. Complete the required action'}/></Field>
        <Field label="Expected result"><textarea name="expected" rows="2" required placeholder="Describe the expected system behaviour…"/></Field>
        <div className="modal-actions"><Button variant="ghost" onClick={() => setShowNewTest(false)}>Cancel</Button><Button type="submit">Save test case</Button></div>
      </form>
    </Modal>}

    {showProjectSettings && <Modal title="Project settings" subtitle="Project context and demo workspace configuration" onClose={() => setShowProjectSettings(false)}>
      <form className="modal-form" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); updateWorkspace({ project: { ...workspace.project, name: fd.get('name'), client: fd.get('client'), owner: fd.get('owner'), sponsor: fd.get('sponsor'), objective: fd.get('objective'), phase: fd.get('phase') } }); setShowProjectSettings(false); notify('Project details updated'); }}>
        <Field label="Project name"><input name="name" defaultValue={workspace.project.name} required/></Field>
        <Field label="Client / organisation"><input name="client" defaultValue={workspace.project.client}/></Field>
        <div className="form-grid"><Field label="Project owner"><input name="owner" defaultValue={workspace.project.owner}/></Field><Field label="Executive sponsor"><input name="sponsor" defaultValue={workspace.project.sponsor}/></Field></div>
        <Field label="Project objective"><textarea name="objective" rows="3" defaultValue={workspace.project.objective}/></Field>
        <Field label="Current phase"><select name="phase" defaultValue={workspace.project.phase}><option>Discovery & definition</option><option>Requirements validation</option><option>Solution design</option><option>Delivery</option><option>UAT & release</option><option>Closed</option></select></Field>
        <div className="modal-actions"><Button variant="ghost" onClick={() => { setShowProjectSettings(false); setShowNewProject(true); }}>＋ New project</Button><Button variant="ghost" onClick={() => setShowProjectSettings(false)}>Cancel</Button><Button type="submit">Save project</Button></div>
      </form>
    </Modal>}

    {showNewProject && <Modal title="Create a new project" subtitle="Start a separate requirements workspace" onClose={() => setShowNewProject(false)}>
      <form className="modal-form" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const next = { project: { id: makeId('PRJ'), name: fd.get('name'), client: fd.get('client'), owner: 'You', sponsor: '', objective: fd.get('objective'), phase: 'Discovery & definition' }, sources: [], requirements: [], stories: [], tests: [], activity: [] }; setWorkspace(next); setSelectedSourceId(''); setSelectedRequirementId(''); setSelectedStoryId(''); setCandidateRequirements([]); setShowNewProject(false); setActiveView('workspace'); notify('New project created'); }}>
        <Field label="Project name"><input name="name" required placeholder="e.g. Claims Journey Redesign"/></Field><Field label="Client / organisation"><input name="client" placeholder="Organisation name"/></Field><Field label="Project objective"><textarea name="objective" rows="3" placeholder="What business outcome should this project achieve?"/></Field>
        <div className="modal-actions"><Button variant="ghost" onClick={() => setShowNewProject(false)}>Cancel</Button><Button type="submit">Create project</Button></div>
      </form>
    </Modal>}

    {toast && <div className="toast"><span className="toast-check">✓</span>{toast}</div>}
    <button className="new-project-fab" title="Create a new project" onClick={() => setShowNewProject(true)}>＋</button>
  </div>;
}

function Modal({ title, subtitle, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal"><div className="modal-head"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="close-btn" onClick={onClose}>×</button></div>{children}</div></div>;
}

function WorkspaceView({ workspace, approvedCount, linkedReqCount, coverage, pendingReviews, setActiveView, setSelectedRequirementId, setShowNewRequirement, setShowNewSource }) {
  const total = workspace.requirements.length;
  const progress = total ? Math.round((approvedCount / total) * 100) : 0;
  const phases = [
    { label: 'Capture discovery', detail: 'Collect source material', done: workspace.sources.length > 0, view: 'discovery', count: `${workspace.sources.length} sources` },
    { label: 'Define requirements', detail: 'Refine scope and priorities', done: total > 0, view: 'requirements', count: `${total} requirements` },
    { label: 'Draft user stories', detail: 'Translate into delivery language', done: workspace.stories.length > 0, view: 'stories', count: `${workspace.stories.length} stories` },
    { label: 'Validate traceability', detail: 'Connect requirements to tests', done: coverage > 0, view: 'traceability', count: `${coverage}% coverage` },
    { label: 'Stakeholder review', detail: 'Approve the requirements baseline', done: approvedCount > 0, view: 'reviews', count: `${approvedCount} approved` }
  ];
  return <>
    <div className="welcome-row"><div><div className="eyebrow">PROJECT WORKSPACE <span className="eyebrow-dot">•</span> {workspace.project.phase}</div><h1>{workspace.project.name}</h1><p className="welcome-description">{workspace.project.objective}</p></div><div className="welcome-meta"><span className="status-pulse"></span><span>Active project</span></div></div>
    <div className="stat-grid"><Stat label="Requirements captured" value={total} note={`${workspace.requirements.filter((r) => r.status === 'Proposed').length} need refinement`} accent="blue"/><Stat label="Approved baseline" value={`${progress}%`} note={`${approvedCount} of ${total} approved`} accent="green"/><Stat label="Story coverage" value={`${total ? Math.round(linkedReqCount / total * 100) : 0}%`} note={`${workspace.stories.length} linked user stories`} accent="purple"/><Stat label="Test coverage" value={`${coverage}%`} note={`${workspace.tests.length} linked test cases`} accent="orange"/></div>

    <div className="workspace-grid">
      <section className="panel journey-panel"><div className="panel-heading"><div><div className="eyebrow">DELIVERY LIFECYCLE</div><h2>Move from discovery to sign-off</h2><p>A guided path from raw stakeholder input to a traceable requirements baseline.</p></div><Badge tone="blue">{progress}% approved</Badge></div>
        <div className="journey-list">{phases.map((p, i) => <button key={p.label} className="journey-step" onClick={() => setActiveView(p.view)}><div className={`journey-marker ${p.done ? 'done' : ''}`}>{p.done ? '✓' : String(i + 1).padStart(2, '0')}</div><div className="journey-copy"><strong>{p.label}</strong><span>{p.detail}</span></div><div className="journey-count">{p.count}</div><span className="step-arrow">→</span></button>)}</div>
        <div className="panel-footer"><span className="muted-small">The lifecycle is a guide; teams can work across stages in parallel.</span><Button variant="secondary" size="sm" onClick={() => setActiveView('traceability')}>Open traceability <span>↗</span></Button></div>
      </section>
      <section className="panel quick-panel"><div className="panel-heading"><div><div className="eyebrow">QUICK ACTIONS</div><h2>Keep the work moving</h2><p>Capture, structure and validate project knowledge.</p></div></div>
        <button className="quick-action" onClick={() => setShowNewSource(true)}><span className="quick-icon violet">✎</span><span><strong>Add discovery notes</strong><small>Paste a workshop or interview summary</small></span><span className="quick-plus">＋</span></button>
        <button className="quick-action" onClick={() => setShowNewRequirement(true)}><span className="quick-icon blue">☷</span><span><strong>Create a requirement</strong><small>Record a business need directly</small></span><span className="quick-plus">＋</span></button>
        <button className="quick-action" onClick={() => setActiveView('reviews')}><span className="quick-icon amber">◎</span><span><strong>Review outstanding items</strong><small>{pendingReviews.length} requirement{pendingReviews.length === 1 ? '' : 's'} waiting for a decision</small></span><span className="quick-number">{pendingReviews.length}</span></button>
        <div className="project-note"><span className="note-icon">i</span><span>Demo project data is fictional. Use the sample flow to explore how a team could manage a requirements baseline.</span></div>
      </section>
    </div>

    <div className="lower-grid"><section className="panel"><div className="panel-title-row"><div><div className="eyebrow">RECENT ACTIVITY</div><h2>What changed</h2></div><button className="text-action" onClick={() => setActiveView('requirements')}>View register →</button></div>
      <div className="activity-list">{workspace.activity.slice(0, 5).map((a) => <div className="activity-item" key={a.id}><span className={`activity-icon ${a.type}`}>{a.type === 'approved' ? '✓' : a.type === 'source' ? '▤' : a.type === 'review' ? '◎' : '↗'}</span><div><strong>{a.text}</strong><small>{timeAgo(a.time)}</small></div></div>)}{!workspace.activity.length && <div className="empty-inline">Activity will appear here as you work.</div>}</div>
    </section><section className="panel project-facts"><div className="eyebrow">PROJECT CONTEXT</div><h2>At a glance</h2><div className="fact-row"><span>Organisation</span><strong>{workspace.project.client || 'Not specified'}</strong></div><div className="fact-row"><span>Project owner</span><strong>{workspace.project.owner || 'Not assigned'}</strong></div><div className="fact-row"><span>Executive sponsor</span><strong>{workspace.project.sponsor || 'Not specified'}</strong></div><div className="fact-row"><span>Start date</span><strong>{formatDate(workspace.project.startDate)}</strong></div><div className="fact-row"><span>Target completion</span><strong>{formatDate(workspace.project.targetDate)}</strong></div></section></div>
  </>;
}

function DiscoveryView({ workspace, currentSource, selectedSourceId, setSelectedSourceId, candidateRequirements, setCandidateRequirements, runExtraction, addCandidate, addAllCandidates, setShowNewSource, handleUpload, notify }) {
  return <><SectionHeader eyebrow="DISCOVERY & INTAKE" title="Discovery inbox" description="Capture stakeholder input, organise source material and turn requirement-like statements into reviewable candidates." actions={<><label className="btn btn-secondary upload-btn">↑ Upload notes<input type="file" accept=".txt,.md,.csv,text/plain,text/markdown,text/csv" onChange={(e) => handleUpload(e.target.files?.[0])} hidden/></label><Button onClick={() => setShowNewSource(true)}>＋ Add source</Button></>}/>
    <div className="discovery-layout"><aside className="panel source-list-panel"><div className="source-list-head"><div><h3>Source library</h3><span>{workspace.sources.length} captured sources</span></div><button className="mini-add" onClick={() => setShowNewSource(true)}>＋</button></div>
      {workspace.sources.map((source) => <button key={source.id} className={`source-card ${source.id === selectedSourceId ? 'selected' : ''}`} onClick={() => { setSelectedSourceId(source.id); setCandidateRequirements([]); }}><div className="source-type-icon">▤</div><div className="source-card-copy"><strong>{source.title}</strong><span>{source.type} · {timeAgo(source.createdAt)}</span></div><span className="source-chevron">›</span></button>)}
      {!workspace.sources.length && <EmptyState title="No discovery sources" text="Add meeting notes, interview summaries or stakeholder requests to get started."/>}
      <div className="source-hint"><strong>Supported input</strong><span>Paste text or upload .txt, .md and .csv files. PDF and image extraction are outside this prototype.</span></div>
    </aside>
    <section className="panel source-workspace">{currentSource ? <><div className="source-workspace-head"><div><div className="eyebrow">{currentSource.type.toUpperCase()} <span className="eyebrow-dot">•</span> {currentSource.id}</div><h2>{currentSource.title}</h2><div className="source-byline">Added by {currentSource.owner} · {formatDate(currentSource.createdAt)}</div></div><Button onClick={runExtraction}>✧ Find candidate requirements</Button></div>
      <div className="source-content-wrap"><div className="source-content-label">SOURCE MATERIAL <span>Original text</span></div><pre className="source-content">{currentSource.content}</pre></div>
      <div className="extraction-note"><span className="sparkle">✧</span><div><strong>Local extraction helper</strong><p>Looks for sentences containing requirement language such as “must”, “shall”, “should” or “need to”. It is rules-based, not an external AI model. Every candidate needs human validation.</p></div><Badge tone="purple">Rules-based demo</Badge></div>
      {candidateRequirements.length > 0 && <div className="candidate-section"><div className="candidate-head"><div><div className="eyebrow">EXTRACTION RESULTS</div><h3>{candidateRequirements.length} candidate requirements</h3><p>Review each statement before adding it to the project register.</p></div><Button size="sm" onClick={addAllCandidates}>Add all candidates</Button></div>
        <div className="candidate-list">{candidateRequirements.map((c) => <div className="candidate-card" key={c.id}><div className="candidate-main"><div className="candidate-title-row"><strong>{c.title}</strong><Badge tone={c.confidence === 'High' ? 'green' : 'amber'}>{c.confidence} confidence</Badge></div><p>{c.description}</p><div className="candidate-meta"><span>{c.category}</span><span>Priority: {c.priority}</span><span>From source sentence {c.sequence}</span></div></div><Button variant="secondary" size="sm" onClick={() => addCandidate(c)}>＋ Add to register</Button></div>)}</div>
      </div>}
      {candidateRequirements.length === 0 && <div className="extraction-empty"><div className="extract-symbol">✧</div><div><strong>Ready to structure this source?</strong><p>Run the extraction helper to identify requirement-like statements from the text above.</p></div></div>}
    </> : <EmptyState title="Choose a source" text="Select a source from the library or add new discovery material." action={<Button onClick={() => setShowNewSource(true)}>Add source</Button>}/>}</section></div>
  </>;
}

function RequirementsView({ workspace, filteredRequirements, selectedRequirement, selectedRequirementId, setSelectedRequirementId, requirementQuery, setRequirementQuery, requirementFilter, setRequirementFilter, updateRequirement, createStoryForRequirement, submitForReview, addRequirementCriterion, setShowNewRequirement, notify }) {
  const [editing, setEditing] = useState(false);
  useEffect(() => setEditing(false), [selectedRequirementId]);
  const [draft, setDraft] = useState(null);
  useEffect(() => { if (selectedRequirement) setDraft({ ...selectedRequirement, acceptanceCriteria: [...(selectedRequirement.acceptanceCriteria || [])] }); }, [selectedRequirement]);
  const linkedStories = selectedRequirement ? workspace.stories.filter((s) => s.requirementId === selectedRequirement.id) : [];
  const linkedTests = selectedRequirement ? workspace.tests.filter((t) => t.requirementId === selectedRequirement.id) : [];
  const saveDraft = () => { if (!draft?.title.trim() || !draft?.description.trim()) return notify('Title and description are required'); updateRequirement(selectedRequirement.id, draft); setEditing(false); notify('Requirement updated'); };
  return <><SectionHeader eyebrow="REQUIREMENTS MANAGEMENT" title="Requirements register" description="Refine business needs into clear, owned and reviewable requirements." actions={<Button onClick={() => setShowNewRequirement(true)}>＋ New requirement</Button>}/>
    <div className="requirements-layout"><section className="panel register-panel"><div className="register-toolbar"><div className="search-box"><span>⌕</span><input value={requirementQuery} onChange={(e) => setRequirementQuery(e.target.value)} placeholder="Search by ID, title or owner…"/></div><select value={requirementFilter} onChange={(e) => setRequirementFilter(e.target.value)}><option>All</option><option>Proposed</option><option>In review</option><option>Approved</option><option>Changes requested</option><option>Rejected</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div>
      <div className="register-summary"><span>{filteredRequirements.length} of {workspace.requirements.length} requirements</span><span className="register-legend"><i className="legend-dot blue"></i> Proposed <i className="legend-dot green"></i> Approved</span></div>
      <div className="requirement-list">{filteredRequirements.map((r) => <button key={r.id} className={`requirement-row ${r.id === selectedRequirementId ? 'selected' : ''}`} onClick={() => setSelectedRequirementId(r.id)}><div className="req-row-main"><div className="req-id-line"><span>{r.id}</span><Badge tone={r.status === 'Approved' ? 'green' : r.status === 'In review' ? 'purple' : r.status === 'Rejected' ? 'red' : r.status === 'Changes requested' ? 'amber' : 'blue'}>{r.status}</Badge></div><strong>{r.title}</strong><small>{r.category} · {r.owner || 'Unassigned'}</small></div><div className={`priority-label priority-${r.priority.toLowerCase()}`}>{r.priority}</div><span className="row-arrow">›</span></button>)}
        {!filteredRequirements.length && <EmptyState title="No matching requirements" text="Try another search or clear the filter."/>}
      </div>
    </section>
    <section className="panel requirement-detail">{selectedRequirement && draft ? <>
      <div className="detail-head"><div><div className="eyebrow">REQUIREMENT DETAIL <span className="eyebrow-dot">•</span> {selectedRequirement.id}</div><div className="detail-head-title"><h2>{selectedRequirement.title}</h2><Badge tone={selectedRequirement.status === 'Approved' ? 'green' : selectedRequirement.status === 'In review' ? 'purple' : 'blue'}>{selectedRequirement.status}</Badge></div><div className="detail-updated">Last updated {timeAgo(selectedRequirement.updatedAt)}</div></div><button className="icon-button" onClick={() => setEditing(!editing)} title="Edit requirement">✎</button></div>
      {editing ? <div className="detail-form"><Field label="Title"><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}/></Field><Field label="Description"><textarea rows="4" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}/></Field><div className="form-grid"><Field label="Category"><select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}><option>Functional</option><option>Non-functional</option><option>Business</option><option>Data</option></select></Field><Field label="Priority"><select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></Field></div><Field label="Owner"><input value={draft.owner || ''} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Assign an owner"/></Field><Field label="Business rationale"><textarea rows="2" value={draft.rationale || ''} onChange={(e) => setDraft({ ...draft, rationale: e.target.value })}/></Field><div className="detail-section edit-criteria-section"><div className="detail-section-title"><h3>Acceptance criteria</h3><button className="text-action" onClick={() => setDraft({ ...draft, acceptanceCriteria: [...(draft.acceptanceCriteria || []), ''] })}>＋ Add criterion</button></div>{(draft.acceptanceCriteria || []).map((criterion, i) => <div className="edit-criterion-row" key={`${selectedRequirement.id}-edit-${i}`}><span>{String(i + 1).padStart(2, '0')}</span><textarea rows="2" value={criterion} onChange={(e) => { const next = [...draft.acceptanceCriteria]; next[i] = e.target.value; setDraft({ ...draft, acceptanceCriteria: next }); }}/><button className="remove-criterion" title="Remove criterion" onClick={() => setDraft({ ...draft, acceptanceCriteria: draft.acceptanceCriteria.filter((_, idx) => idx !== i) })}>×</button></div>)}</div><div className="inline-actions"><Button size="sm" onClick={saveDraft}>Save changes</Button><Button size="sm" variant="ghost" onClick={() => { setDraft({ ...selectedRequirement, acceptanceCriteria: [...(selectedRequirement.acceptanceCriteria || [])] }); setEditing(false); }}>Cancel</Button></div></div> : <>
        <div className="detail-property-grid"><div><span>PRIORITY</span><strong className={`priority-text priority-${selectedRequirement.priority.toLowerCase()}`}>{selectedRequirement.priority}</strong></div><div><span>CATEGORY</span><strong>{selectedRequirement.category}</strong></div><div><span>OWNER</span><strong>{selectedRequirement.owner || 'Unassigned'}</strong></div></div>
        <div className="detail-section"><div className="detail-section-title"><h3>Description</h3></div><p className="requirement-description">{selectedRequirement.description}</p></div>
        <div className="detail-section"><div className="detail-section-title"><h3>Acceptance criteria</h3><button className="text-action" onClick={() => { const next = [...(selectedRequirement.acceptanceCriteria || []), '']; updateRequirement(selectedRequirement.id, { acceptanceCriteria: next }); setDraft({ ...draft, acceptanceCriteria: next }); }}>＋ Add criterion</button></div><div className="criteria-list">{(selectedRequirement.acceptanceCriteria || []).map((criterion, i) => <div className="criterion-item" key={`${selectedRequirement.id}-${i}`}><span className="criterion-number">{String(i + 1).padStart(2, '0')}</span>{editing ? <input value={criterion} onChange={(e) => { const next = [...draft.acceptanceCriteria]; next[i] = e.target.value; setDraft({ ...draft, acceptanceCriteria: next }); }} /> : <span>{criterion}</span>}</div>)}</div></div>
        <div className="detail-section"><div className="detail-section-title"><h3>Traceability links</h3></div><div className="linked-pills"><span className="linked-pill"><b>{linkedStories.length}</b> stories</span><span className="linked-pill"><b>{linkedTests.length}</b> test cases</span><span className="linked-pill"><b>{(selectedRequirement.sourceIds || []).length}</b> sources</span></div><div className="source-link-list">{(selectedRequirement.sourceIds || []).map((id) => { const src = workspace.sources.find((s) => s.id === id); return <span key={id}>▤ {src?.title || id}</span>; })}</div></div>
        <div className="detail-actions"><Button variant="secondary" size="sm" onClick={() => createStoryForRequirement(selectedRequirement)}>✧ Draft user story</Button>{selectedRequirement.status !== 'In review' && selectedRequirement.status !== 'Approved' && <Button size="sm" onClick={() => submitForReview(selectedRequirement)}>Send for review →</Button>}{selectedRequirement.status === 'Approved' && <Badge tone="green">✓ Approved baseline</Badge>}</div>
      </>}</> : <EmptyState title="Select a requirement" text="Choose an item in the register to review its details and linked delivery artefacts."/>}</section></div>
  </>;
}

function StoriesView({ workspace, selectedStory, selectedStoryId, setSelectedStoryId, updateStory, storyQuery, setStoryQuery, addStoryCriterion }) {
  const [draft, setDraft] = useState(null);
  useEffect(() => { if (selectedStory) setDraft({ ...selectedStory, acceptanceCriteria: [...(selectedStory.acceptanceCriteria || [])] }); }, [selectedStoryId]);
  const [notice, setNotice] = useState(false);
  const filtered = workspace.stories.filter((s) => `${s.id} ${s.title} ${s.asA} ${s.iWant}`.toLowerCase().includes(storyQuery.toLowerCase()));
  const addBlankCriterion = () => { if (!selectedStory) return; const next = [...(selectedStory.acceptanceCriteria || []), '']; updateStory(selectedStory.id, { acceptanceCriteria: next }); setDraft({ ...draft, acceptanceCriteria: next }); };
  const save = () => { updateStory(selectedStory.id, draft); setNotice(true); window.setTimeout(() => setNotice(false), 2200); };
  return <><SectionHeader eyebrow="DELIVERY DEFINITION" title="Stories & acceptance criteria" description="Translate requirements into implementable user stories that engineers and testers can understand." actions={<Badge tone="purple">Local drafting assistant</Badge>}/>
    <div className="stories-layout"><section className="panel stories-list-panel"><div className="list-panel-head"><h3>User stories <span>{workspace.stories.length}</span></h3><div className="search-box compact"><span>⌕</span><input value={storyQuery} onChange={(e) => setStoryQuery(e.target.value)} placeholder="Search stories…"/></div></div>
      {filtered.map((s) => <button key={s.id} className={`story-list-item ${s.id === selectedStoryId ? 'selected' : ''}`} onClick={() => setSelectedStoryId(s.id)}><div className="story-list-id"><span>{s.id}</span><Badge tone={s.status === 'Ready' ? 'green' : s.status === 'In progress' ? 'blue' : 'neutral'}>{s.status}</Badge></div><strong>{s.title}</strong><small>Linked to {s.requirementId} · {s.points || 0} points</small></button>)}
      {!filtered.length && <EmptyState title="No stories found" text="Create a user story from a requirement to begin."/>}
      <div className="story-helper"><span>✧</span><div><strong>Start from a requirement</strong><p>Open the requirement register and use “Draft user story” to create a structured first draft.</p></div></div>
    </section>
    <section className="panel story-editor">{selectedStory && draft ? <><div className="story-editor-head"><div><div className="eyebrow">USER STORY <span className="eyebrow-dot">•</span> {selectedStory.id}</div><h2>{selectedStory.title}</h2><div className="linked-to">Linked requirement <b>{selectedStory.requirementId}</b></div></div><Badge tone="blue">{selectedStory.status}</Badge></div>
      <div className="story-sentence"><div className="eyebrow">USER STORY STATEMENT</div><p>As a <input value={draft.asA} onChange={(e) => setDraft({ ...draft, asA: e.target.value })}/>, I want <input value={draft.iWant} onChange={(e) => setDraft({ ...draft, iWant: e.target.value })}/>, so that <input value={draft.soThat} onChange={(e) => setDraft({ ...draft, soThat: e.target.value })} />.</p></div>
      <div className="story-fields"><Field label="Delivery owner"><input value={draft.owner || ''} onChange={(e) => setDraft({ ...draft, owner: e.target.value })}/></Field><Field label="Delivery status"><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option>Backlog</option><option>Ready</option><option>In progress</option><option>Blocked</option><option>Done</option></select></Field><Field label="Story points"><select value={draft.points || 3} onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })}><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="5">5</option><option value="8">8</option><option value="13">13</option></select></Field></div>
      <div className="detail-section story-criteria"><div className="detail-section-title"><div><h3>Acceptance criteria</h3><p>Define observable outcomes that can be verified during testing.</p></div><button className="text-action" onClick={addBlankCriterion}>＋ Add criterion</button></div><div className="editable-criteria">{(draft.acceptanceCriteria || []).map((c, i) => <div className="editable-criterion" key={i}><span>{String(i + 1).padStart(2, '0')}</span><textarea rows="2" value={c} onChange={(e) => { const next = [...draft.acceptanceCriteria]; next[i] = e.target.value; setDraft({ ...draft, acceptanceCriteria: next }); }}/><button className="remove-criterion" title="Remove criterion" onClick={() => { const next = draft.acceptanceCriteria.filter((_, idx) => idx !== i); setDraft({ ...draft, acceptanceCriteria: next }); }}>×</button></div>)}</div></div>
      <div className="story-editor-footer"><div className="muted-small">Drafted from requirement context. Validate wording with the product owner and delivery team.</div><div className="inline-actions"><Button variant="secondary" size="sm" onClick={() => { const r = workspace.requirements.find((x) => x.id === selectedStory.requirementId); if (r) setDraft({ ...draft, ...draftStory(r), id: draft.id, requirementId: draft.requirementId, owner: draft.owner, status: draft.status, points: draft.points }); }}>↻ Re-draft</Button><Button size="sm" onClick={save}>Save story</Button></div></div>{notice && <div className="inline-success">✓ Story saved</div>}
    </> : <EmptyState title="No story selected" text="Draft a story from a requirement and edit it here."/>}</section></div>
  </>;
}

function TraceabilityView({ workspace, setSelectedRequirementId, setSelectedStoryId, setActiveView, setShowNewTest, setTestForRequirement, notify }) {
  const [query, setQuery] = useState('');
  const filtered = workspace.requirements.filter((r) => `${r.id} ${r.title}`.toLowerCase().includes(query.toLowerCase()));
  const exportMatrix = () => {
    const rows = [['Requirement ID', 'Requirement', 'Status', 'Story IDs', 'Test IDs', 'Coverage']];
    workspace.requirements.forEach((r) => { const stories = workspace.stories.filter((s) => s.requirementId === r.id); const tests = workspace.tests.filter((t) => t.requirementId === r.id); rows.push([r.id, r.title, r.status, stories.map((s) => s.id).join('; '), tests.map((t) => t.id).join('; '), tests.length ? 'Covered' : 'No test']); });
    downloadFile('specflow-traceability-matrix.csv', rows.map((row) => row.map(escapeCsv).join(',')).join('\n'), 'text/csv;charset=utf-8'); notify('Traceability matrix exported');
  };
  return <><SectionHeader eyebrow="QUALITY & COVERAGE" title="Traceability matrix" description="Follow each business requirement through delivery stories and verification tests." actions={<Button variant="secondary" onClick={exportMatrix}>↓ Export matrix</Button>}/>
    <div className="trace-stats"><div className="trace-stat"><strong>{workspace.requirements.length}</strong><span>Requirements</span></div><div className="trace-stat"><strong>{workspace.stories.length}</strong><span>User stories</span></div><div className="trace-stat"><strong>{workspace.tests.length}</strong><span>Test cases</span></div><div className="trace-stat"><strong>{workspace.requirements.filter((r) => workspace.tests.some((t) => t.requirementId === r.id)).length}/{workspace.requirements.length}</strong><span>Requirements with tests</span></div></div>
    <section className="panel matrix-panel"><div className="matrix-toolbar"><div><h2>Requirement coverage</h2><p>One row per requirement, with linked delivery and verification artefacts.</p></div><div className="search-box compact"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter requirements…"/></div></div>
      <div className="matrix-table-wrap"><table className="matrix-table"><thead><tr><th className="req-col">REQUIREMENT</th><th>STATUS</th><th>USER STORIES</th><th>TEST CASES</th><th>COVERAGE</th><th></th></tr></thead><tbody>{filtered.map((r) => { const stories = workspace.stories.filter((s) => s.requirementId === r.id); const tests = workspace.tests.filter((t) => t.requirementId === r.id); return <tr key={r.id}><td><button className="matrix-req" onClick={() => { setSelectedRequirementId(r.id); setActiveView('requirements'); }}><small>{r.id}</small><strong>{r.title}</strong></button></td><td><Badge tone={r.status === 'Approved' ? 'green' : r.status === 'In review' ? 'purple' : 'blue'}>{r.status}</Badge></td><td><div className="matrix-links">{stories.length ? stories.map((s) => <button key={s.id} className="link-chip" onClick={() => { setSelectedStoryId(s.id); setActiveView('stories'); }}>{s.id}</button>) : <span className="not-linked">Not linked</span>}</div></td><td><div className="matrix-links">{tests.length ? tests.map((t) => <span key={t.id} className="link-chip test-chip">{t.id}</span>) : <span className="not-linked">Not linked</span>}</div></td><td>{tests.length ? <span className="coverage-covered">● Covered</span> : <span className="coverage-gap">○ Gap</span>}</td><td><button className="add-test-button" title="Add test case" onClick={() => { setTestForRequirement(r.id); setShowNewTest(true); }}>＋ Test</button></td></tr>; })}</tbody></table></div>
      {!filtered.length && <EmptyState title="No requirements match" text="Try another search term."/>}
      <div className="matrix-footer"><span><i className="legend-dot green"></i> At least one test linked</span><span><i className="legend-dot amber"></i> No test coverage yet</span><span>Click a requirement ID to inspect its detail.</span></div>
    </section>
  </>;
}

function ReviewsView({ workspace, pendingReviews, decideReview, setSelectedRequirementId, setActiveView }) {
  const [reviewComment, setReviewComment] = useState({});
  const inQueue = workspace.requirements.filter((r) => r.status === 'In review');
  const history = workspace.requirements.filter((r) => ['Approved', 'Changes requested', 'Rejected'].includes(r.status));
  return <><SectionHeader eyebrow="GOVERNANCE & SIGN-OFF" title="Stakeholder reviews" description="Record decisions on proposed requirements and maintain a visible approval trail." actions={<Badge tone={pendingReviews.length ? 'amber' : 'green'}>{pendingReviews.length} awaiting decision</Badge>}/>
    <div className="review-intro"><div className="review-intro-icon">◎</div><div><strong>Review is a controlled hand-off</strong><p>Requirements submitted from the register appear here. Decisions are recorded in the local project workspace; this demo does not send external notifications.</p></div></div>
    <section className="review-section"><div className="section-subhead"><div><h2>Awaiting your review</h2><p>Check the requirement wording, ownership and any unresolved assumptions.</p></div><span className="subhead-count">{inQueue.length} items</span></div>
      {inQueue.length ? <div className="review-card-list">{inQueue.map((r) => <div className="panel review-card" key={r.id}><div className="review-card-top"><div><div className="eyebrow">{r.id} <span className="eyebrow-dot">•</span> {r.category}</div><h3>{r.title}</h3></div><Badge tone="purple">In review</Badge></div><p>{r.description}</p><div className="review-meta"><span>Priority <b>{r.priority}</b></span><span>Owner <b>{r.owner || 'Unassigned'}</b></span><span>Submitted <b>{formatDate(r.review?.submittedAt)}</b></span><span>Reviewer <b>{r.review?.reviewer || 'Jordan Patel'}</b></span></div><div className="review-comment"><label>Review note (optional)</label><input value={reviewComment[r.id] || ''} onChange={(e) => setReviewComment({ ...reviewComment, [r.id]: e.target.value })} placeholder="Add a comment for the decision…"/></div><div className="review-actions"><button className="text-action" onClick={() => { setSelectedRequirementId(r.id); setActiveView('requirements'); }}>Open requirement ↗</button><div><Button size="sm" variant="danger-outline" onClick={() => decideReview(r, 'Rejected')}>Reject</Button><Button size="sm" variant="secondary" onClick={() => { decideReview(r, 'Changes requested'); }}>Request changes</Button><Button size="sm" onClick={() => decideReview(r, 'Approved')}>✓ Approve</Button></div></div></div>)}</div> : <div className="panel review-empty"><EmptyState icon="✓" title="Review queue is clear" text="When a requirement is submitted for review, it will appear here."/></div>}
    </section>
    <section className="review-section"><div className="section-subhead"><div><h2>Decision history</h2><p>Previously reviewed requirements and their current outcomes.</p></div><span className="subhead-count">{history.length} decisions</span></div><div className="panel history-panel">{history.length ? history.map((r) => <div className="history-row" key={r.id}><div className={`history-icon ${r.status === 'Approved' ? 'approved' : 'other'}`}>{r.status === 'Approved' ? '✓' : '↻'}</div><div className="history-copy"><strong>{r.title}</strong><small>{r.id} · {r.review?.reviewer || 'Reviewer'} · {formatDate(r.review?.decidedAt || r.updatedAt)}</small></div><Badge tone={r.status === 'Approved' ? 'green' : r.status === 'Rejected' ? 'red' : 'amber'}>{r.status}</Badge></div>) : <div className="empty-inline">No decisions recorded yet.</div>}</div></section>
  </>;
}

function ImpactView({ workspace, impactRequirementId, setImpactRequirementId, setSelectedRequirementId, setActiveView }) {
  const req = workspace.requirements.find((r) => r.id === impactRequirementId) || workspace.requirements[0];
  const stories = workspace.stories.filter((s) => s.requirementId === req?.id);
  const tests = workspace.tests.filter((t) => t.requirementId === req?.id);
  const sources = workspace.sources.filter((s) => req?.sourceIds?.includes(s.id));
  return <><SectionHeader eyebrow="CHANGE CONTROL" title="Change impact analysis" description="Understand which delivery artefacts and source decisions may be affected when a requirement changes." actions={<Badge tone="purple">Relationship-based view</Badge>}/>
    <section className="panel impact-selector"><div><div className="eyebrow">SELECT REQUIREMENT</div><h2>Inspect downstream dependencies</h2><p>Choose a requirement to see its current links. This is a deterministic dependency view, not automated semantic analysis.</p></div><select value={impactRequirementId} onChange={(e) => setImpactRequirementId(e.target.value)}>{workspace.requirements.map((r) => <option key={r.id} value={r.id}>{r.id} · {r.title}</option>)}</select></section>
    {req ? <><div className="impact-summary"><div><span>SELECTED REQUIREMENT</span><strong>{req.id}</strong><p>{req.title}</p></div><div><span>DOWNSTREAM ARTEFACTS</span><strong>{stories.length + tests.length}</strong><p>{stories.length} stories · {tests.length} tests</p></div><div><span>SOURCE REFERENCES</span><strong>{sources.length}</strong><p>Discovery materials linked</p></div><div><span>REVIEW STATE</span><strong><Badge tone={req.status === 'Approved' ? 'green' : req.status === 'In review' ? 'purple' : 'blue'}>{req.status}</Badge></strong><p>Current requirement status</p></div></div>
      <div className="impact-flow"><div className="impact-column"><div className="impact-column-head"><span className="impact-step">01</span><div><h3>Source material</h3><small>Original business context</small></div></div>{sources.length ? sources.map((s) => <div className="impact-node source-node" key={s.id}><span>▤</span><div><strong>{s.title}</strong><small>{s.id} · {s.type}</small></div></div>) : <div className="impact-no-link">No source linked</div>}</div><div className="impact-connector">→</div><div className="impact-column focus-column"><div className="impact-column-head"><span className="impact-step">02</span><div><h3>Requirement</h3><small>Change origin</small></div></div><div className="impact-node requirement-node"><span>☷</span><div><strong>{req.title}</strong><small>{req.id} · {req.priority} priority</small><p>{req.description}</p></div></div></div><div className="impact-connector">→</div><div className="impact-column"><div className="impact-column-head"><span className="impact-step">03</span><div><h3>Delivery artefacts</h3><small>Potential rework surface</small></div></div>{stories.map((s) => <div className="impact-node story-node" key={s.id}><span>◫</span><div><strong>{s.title}</strong><small>{s.id} · User story</small></div></div>)}{tests.map((t) => <div className="impact-node test-node" key={t.id}><span>✓</span><div><strong>{t.title}</strong><small>{t.id} · Test case</small></div></div>)}{!stories.length && !tests.length && <div className="impact-no-link">No downstream links yet</div>}</div></div>
      <div className="impact-guidance"><div className="guidance-icon">!</div><div><strong>Change-control checklist</strong><p>Before changing this requirement, review its source context, update linked stories and acceptance criteria, revise affected tests, and obtain re-approval if the baseline has already been approved.</p></div><Button variant="secondary" size="sm" onClick={() => { setSelectedRequirementId(req.id); setActiveView('requirements'); }}>Open requirement</Button></div>
    </> : <EmptyState title="No requirements yet" text="Add requirements to inspect their dependencies."/>}
  </>;
}

function ExportsView({ workspace, notify }) {
  const exportJson = () => { downloadFile(`${slug(workspace.project.name)}-workspace.json`, JSON.stringify(workspace, null, 2), 'application/json;charset=utf-8'); notify('Project JSON exported'); };
  const exportBrd = () => { downloadFile(`${slug(workspace.project.name)}-BRD.md`, buildBrd(workspace), 'text/markdown;charset=utf-8'); notify('BRD exported as Markdown'); };
  const exportCsv = () => { downloadFile(`${slug(workspace.project.name)}-requirements.csv`, makeCsv(workspace.requirements), 'text/csv;charset=utf-8'); notify('Requirements CSV exported'); };
  return <><SectionHeader eyebrow="DOCUMENTATION & HANDOVER" title="Documents & exports" description="Create portable artefacts for stakeholder review, delivery hand-off and project backup."/>
    <div className="export-grid"><div className="panel export-card"><div className="export-icon brd">▤</div><div className="eyebrow">STAKEHOLDER DOCUMENT</div><h2>Business Requirements Document</h2><p>Structured Markdown document with project context, requirements, acceptance criteria, linked stories, test coverage and open decisions.</p><div className="export-details"><span>{workspace.requirements.length} requirements</span><span>{workspace.stories.length} stories</span><span>{workspace.tests.length} tests</span></div><Button onClick={exportBrd}>↓ Export BRD</Button></div>
      <div className="panel export-card"><div className="export-icon csv">▦</div><div className="eyebrow">SPREADSHEET-FRIENDLY DATA</div><h2>Requirements register CSV</h2><p>Flat requirements dataset for review in Excel or import into another work-management tool.</p><div className="export-details"><span>8 columns</span><span>{workspace.requirements.length} rows</span><span>UTF-8 CSV</span></div><Button variant="secondary" onClick={exportCsv}>↓ Export CSV</Button></div>
      <div className="panel export-card"><div className="export-icon json">{`{ }`}</div><div className="eyebrow">PORTABLE WORKSPACE BACKUP</div><h2>Complete project JSON</h2><p>Full backup of project settings, sources, requirements, stories, tests and activity. Useful for moving or inspecting prototype data.</p><div className="export-details"><span>All entities</span><span>Structured JSON</span><span>Local backup</span></div><Button variant="secondary" onClick={exportJson}>↓ Export workspace</Button></div></div>
    <div className="panel export-warning"><span className="warning-icon">i</span><div><strong>Baseline and data-handling note</strong><p>Exports reflect the current browser workspace, including unapproved requirements. The BRD labels outstanding decisions; it does not certify that the content has been legally, technically or operationally approved. Export a JSON backup before clearing browser storage or moving to another device.</p></div></div>
  </>;
}
function slug(text) { return String(text || 'specflow-project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'specflow-project'; }

export default App;
