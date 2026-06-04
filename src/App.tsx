import {
  Check,
  Code2,
  GitBranch,
  Layers,
  Plus,
  Radio,
  UserCircle
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { fetchCommitsAsReleases } from "./github";

import { createContext, useContext } from "react";
export const ReleasesContext = createContext<Release[]>([]);

import BorderGlow from "./BorderGlow";
import MagnetLines from "./MagnetLines";

export type Step = 1 | 2 | 3 | 4;
export type View = "feed" | "review" | "customers" | "alignment";
export type ReleaseStatus = "Review" | "Ready" | "Blocked" | "Live";
export type FeedFilter = "all" | "attention" | "staged" | "live";
export type Role = "Founder / PM" | "Developer";
export type WorkspaceStatus = "On track" | "Watch" | "Blocked";

export type WorkspaceProject = {
  id: string;
  name: string;
  description: string;
  focus: string;
  reviewer: string;
  codebases: string[];
  status: WorkspaceStatus;
};

export type Release = {
  id: string;
  repo: string;
  version: string;
  channel: string;
  status: ReleaseStatus;
  rollout: string;
  customerCoverage: string;
  customers: string;
  title: string;
  raw: string;
  meaning: string;
  affected: string;
  action: string;
  cost: string;
  owner: string;
  pm: string;
};

const mockReleases: Release[] = [
  {
    id: "api-218",
    repo: "api",
    version: "v2.18",
    channel: "Production",
    status: "Ready",
    rollout: "100%",
    customerCoverage: "All Salesforce workspaces",
    customers: "36 accounts",
    title: "Duplicate account matches are fixed",
    raw: "(api) v2.18 - fix duplicate account matching for Salesforce imports",
    meaning: "Imported Salesforce accounts now match to one company record instead of creating duplicates. Sales teams get cleaner target account lists.",
    affected: "Customers importing Salesforce account lists. Highest impact: teams running named-account campaigns.",
    action: "Customer success should tell affected teams to rerun their last Salesforce import before launching new sequences.",
    cost: "Medium GTM cost if ignored. Duplicate accounts can split buying signals and create noisy outbound lists.",
    owner: "Karan",
    pm: "Priya"
  },
  {
    id: "web-407",
    repo: "web",
    version: "v4.07",
    channel: "Staged rollout",
    status: "Review",
    rollout: "25%",
    customerCoverage: "Early-access sales teams",
    customers: "9 accounts",
    title: "Buying signals appear on account pages",
    raw: "(web) v4.07 - expose intent_signal_summary on account detail page",
    meaning: "Sales reps can now see why an account is heating up directly on the account page.",
    affected: "Early-access customers using account intelligence in daily prospecting.",
    action: "Do not announce broadly yet. Ask early-access teams whether the signal wording is clear enough for reps.",
    cost: "Low product risk, medium trust risk. If the wording is unclear, reps may ignore the signal.",
    owner: "Ishan",
    pm: "Sam"
  },
  {
    id: "worker-031",
    repo: "enrichment-worker",
    version: "v0.31",
    channel: "Production",
    status: "Live",
    rollout: "100%",
    customerCoverage: "All enrichment customers",
    customers: "41 accounts",
    title: "Company enrichment now runs overnight",
    raw: "(enrichment-worker) v0.31 - schedule nightly domain enrichment batch",
    meaning: "Company firmographics and domains refresh overnight instead of waiting for a manual update.",
    affected: "Customers using enrichment to build account lists.",
    action: "Support can tell customers that stale company data should refresh by the next morning.",
    cost: "Low. This reduces manual cleanup and support follow-up.",
    owner: "Nora",
    pm: "Priya"
  },
  {
    id: "integrations-112",
    repo: "integrations",
    version: "v1.12",
    channel: "Production",
    status: "Blocked",
    rollout: "100%",
    customerCoverage: "Large HubSpot lists",
    customers: "3 accounts",
    title: "HubSpot sync is blocked for large lists",
    raw: "(integrations) v1.12 - pause hubspot sync for lists over 50k contacts",
    meaning: "Three customers cannot sync large HubSpot lists into Bridgr until the import job is fixed.",
    affected: "ABM teams syncing enterprise-sized HubSpot lists.",
    action: "Success should proactively message the three accounts and recommend smaller segmented imports for now.",
    cost: "High renewal risk if ignored. Campaign launch timelines are paused for these customers.",
    owner: "Arun",
    pm: "Leah"
  },
  {
    id: "chrome-009",
    repo: "chrome-extension",
    version: "v0.09",
    channel: "Private beta",
    status: "Review",
    rollout: "Beta",
    customerCoverage: "Sales pilot users",
    customers: "14 users",
    title: "LinkedIn contact capture retry is being tested",
    raw: "(chrome-extension) v0.09 - retry contact capture after linkedin timeout",
    meaning: "The extension retries once when LinkedIn contact capture times out, reducing failed account research sessions.",
    affected: "Pilot users capturing contacts from LinkedIn into target accounts.",
    action: "Keep this in beta until failed capture rate is lower for two days.",
    cost: "Medium trust risk. A flaky extension makes the product feel unreliable during prospecting.",
    owner: "Maya",
    pm: "Leah"
  }
];

const statusClass: Record<ReleaseStatus, string> = {
  Review: "amber",
  Ready: "blue",
  Blocked: "red",
  Live: "green"
};

const starterProjects: WorkspaceProject[] = [
  {
    id: "signalbase",
    name: "SignalBase",
    description: "ABM account intelligence",
    focus: "Enterprise HubSpot and Salesforce imports must be stable before the next ABM campaign.",
    reviewer: "Karan",
    codebases: ["api", "web", "enrichment-worker", "integrations", "chrome-extension"],
    status: "Watch"
  },
  {
    id: "atlas",
    name: "Atlas CRM",
    description: "Sales workspace and account notes",
    focus: "Account notes must stay reliable before the partner pilot expands.",
    reviewer: "Nora",
    codebases: ["web", "api", "mobile"],
    status: "On track"
  },
  {
    id: "pulse",
    name: "Pulse Outreach",
    description: "Outbound sequencing and inbox",
    focus: "Sequence scheduling should not delay the February outbound launch.",
    reviewer: "Arun",
    codebases: ["backend", "web", "worker"],
    status: "Watch"
  }
];

export function App() {
  const [step, setStep] = useState<Step>(new URLSearchParams(location.search).get("skip") === "1" ? 4 : 1);
  const [role, setRole] = useState<Role>("Founder / PM");
  const [github, setGithub] = useState(false);
  const [githubRepo, setGithubRepo] = useState("ShravaniAvadhanam/Bridgr");
  const [releases, setReleases] = useState<Release[]>(mockReleases);
  const [linear, setLinear] = useState(false);
  const [project, setProject] = useState("SignalBase");
  const [developer, setDeveloper] = useState("karan@signalbase.ai");
  const [workspaceProjects, setWorkspaceProjects] = useState<WorkspaceProject[]>(starterProjects);
  const [activeProjectId, setActiveProjectId] = useState(starterProjects[0].id);
  const [focusDraft, setFocusDraft] = useState(starterProjects[0].focus);
  const [focusSaved, setFocusSaved] = useState(false);
  const [projectNotice, setProjectNotice] = useState("");
  const [selectedCodebases, setSelectedCodebases] = useState(starterProjects[0].codebases);
  const [reviewerInvited, setReviewerInvited] = useState(false);
  const [loading, setLoading] = useState("");
  const [view, setView] = useState<View>("feed");
  const [selectedId, setSelectedId] = useState(releases[0].id);

  const selected = releases.find((release) => release.id === selectedId) ?? releases[0];
  const activeProject = workspaceProjects.find((item) => item.id === activeProjectId) ?? workspaceProjects[0];

  const connect = async (target: "github" | "linear") => {
    setLoading(target);
    if (target === "github") {
      const fetched = await fetchCommitsAsReleases(githubRepo);
      if (fetched.length > 0) {
        setReleases(fetched);
        setGithub(true);
      }
      setLoading("");
      setStep(3);
    } else {
      window.setTimeout(() => {
        setLinear(true);
        setLoading("");
      }, 650);
    }
  };

  const selectProject = (id: string) => {
    const nextProject = workspaceProjects.find((item) => item.id === id);
    if (!nextProject) return;
    setActiveProjectId(id);
    setFocusDraft(nextProject.focus);
    setSelectedCodebases(nextProject.codebases);
    setFocusSaved(false);
    setProjectNotice(`${nextProject.name} loaded`);
    window.setTimeout(() => setProjectNotice(""), 1200);
  };

  const saveFocus = () => {
    const nextFocus = focusDraft.trim() || activeProject.focus;
    setWorkspaceProjects((items) =>
      items.map((item) =>
        item.id === activeProjectId
          ? { ...item, focus: nextFocus }
          : item
      )
    );
    setFocusDraft(nextFocus);
    setFocusSaved(true);
    window.setTimeout(() => setFocusSaved(false), 1200);
  };

  const addProject = () => {
    const nextNumber = workspaceProjects.length + 1;
    const nextProject: WorkspaceProject = {
      id: `project-${nextNumber}`,
      name: `New ABM project ${nextNumber}`,
      description: "New product workspace",
      focus: "Set the release goal before the next customer walkthrough.",
      reviewer: developer.split("@")[0] || "Developer",
      codebases: ["api", "web"],
      status: "On track"
    };
    setWorkspaceProjects((items) => [...items, nextProject]);
    setActiveProjectId(nextProject.id);
    setProject(nextProject.name);
    setFocusDraft(nextProject.focus);
    setSelectedCodebases(nextProject.codebases);
    setFocusSaved(false);
    setProjectNotice("New project ready");
    window.setTimeout(() => setProjectNotice(""), 1400);
  };

  const toggleCodebase = (codebase: string) => {
    setSelectedCodebases((items) => {
      if (items.includes(codebase)) {
        return items.length === 1 ? items : items.filter((item) => item !== codebase);
      }
      return [...items, codebase];
    });
  };

  const inviteReviewer = () => {
    setReviewerInvited(true);
    window.setTimeout(() => setReviewerInvited(false), 1600);
  };

  const openPlatform = () => {
    const nextFocus = focusDraft.trim() || activeProject.focus;
    setWorkspaceProjects((items) =>
      items.map((item) =>
        item.id === activeProjectId
          ? {
              ...item,
              focus: nextFocus,
              name: project.trim() || item.name,
              reviewer: developer.split("@")[0] || item.reviewer,
              codebases: selectedCodebases
            }
          : item
      )
    );
    setFocusDraft(nextFocus);
    setStep(4);
  };

  if (step === 2) {
    return (
      <OnboardingPage step={2}>
        <section className="stack">
          <Dots step={2} />
          <header>
            <h1>Connect GitHub</h1>
            <p>Bridgr reads release notes and commit history.</p>
            <label style={{marginTop: '1rem', display: 'block'}}>
              <span>GitHub Repository</span>
              <input style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '4px'}} value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} placeholder="e.g. ShravaniAvadhanam/Bridgr" />
            </label>
          </header>
          <ConnectionCard
            icon={<GitBranch size={20} />}
            title="GitHub"
            chip="Required"
            side="Read-only"
            rows={[
              ["Read releases, commits, tags, and codebase names", true],
              ["Group version history across API, web, enrichment, integrations, and sales tools", true],
              ["Write or modify your code", false]
            ]}
            footer="Disconnect anytime from Settings. Your code never leaves GitHub."
          />
          <ConnectionCard
            muted
            icon={<Layers size={18} />}
            title="Linear"
            chip="Optional"
            rows={[
              ["Read issue status and roadmap labels", true],
              ["Connect releases to customer-facing work", true]
            ]}
            footer="Connect Linear when you want release impact matched to product work."
          />
          <div className="actions">
            <button className="button primary" onClick={() => connect("github")}>
              {loading === "github" ? "Connecting..." : github ? "GitHub connected ✓" : "Connect GitHub →"}
            </button>
            <button className="button ghost" onClick={() => connect("linear")}>
              {loading === "linear" ? "Connecting..." : linear ? "Linear connected ✓" : "Connect Linear too"}
            </button>
            <p>I'll do this later <button onClick={() => setStep(3)}>Skip for now</button></p>
          </div>
        </section>
      </OnboardingPage>
    );
  }

  if (step === 3) {
    return (
      <OnboardingPage step={3}>
        <section className="stack compact">
          <div className="step-inline"><Dots step={3} complete /><span>Step 3 of 3</span></div>
          <span className="chip">Almost done</span>
          <header>
            <h1>Set the product focus</h1>
            <p>Name the workspace, choose the reviewer, and tell Bridgr what releases need to prove this week.</p>
          </header>
          <form className="form-card">
            <label>
              <span>Product name</span>
              <input value={project} onChange={(event) => setProject(event.target.value)} placeholder="e.g. SignalBase" />
            </label>
            <label>
              <span>This week's focus</span>
              <small>Bridgr compares release activity against this statement.</small>
              <textarea value={focusDraft} onChange={(event) => setFocusDraft(event.target.value)} placeholder="e.g. Enterprise imports must be stable before the next ABM campaign." />
            </label>
            <label>
              <span>Codebases to watch</span>
              <small>Start with the repositories that affect customer-facing releases.</small>
              <div className="codebase-grid" role="group" aria-label="Codebases to watch">
                {starterProjects[0].codebases.map((codebase) => {
                  const selected = selectedCodebases.includes(codebase);
                  return (
                    <button
                      type="button"
                      className={`codebase-toggle ${selected ? "selected" : ""}`}
                      aria-pressed={selected}
                      key={codebase}
                      onClick={() => toggleCodebase(codebase)}
                    >
                      <span>{codebase}</span>
                      {selected && <Check size={13} />}
                    </button>
                  );
                })}
              </div>
            </label>
            <label>
              <span>Release reviewer</span>
              <small>They check each plain-English summary before product uses it.</small>
              <div className="invite-row">
                <input value={developer} onChange={(event) => setDeveloper(event.target.value)} placeholder="developer@company.com" />
                <button type="button" className={reviewerInvited ? "button primary confirm-button" : "button ghost"} onClick={inviteReviewer} disabled={!developer.trim()}>
                  {reviewerInvited && <Check size={14} />}
                  {reviewerInvited ? "Invite sent" : "Invite reviewer"}
                </button>
              </div>
            </label>
            <div className="role-confirm">
              <UserCircle size={15} />
              <span>Joining as <strong>{role}</strong></span>
              <button type="button" onClick={() => setStep(1)}>Change</button>
            </div>
          </form>
          <section className="next-card">
            <p className="label">Activation</p>
            <p><span>01</span>{selectedCodebases.length} codebases will appear in the first release feed.</p>
            <p><span>02</span>Each release is checked against the focus you set.</p>
            <p><span>03</span><b>{developer || "Your developer"}</b> approves summaries before PMs act.</p>
          </section>
          <button className="button primary" onClick={openPlatform}>Open release feed →</button>
          <p className="fine center">You can add more projects and codebases from the sidebar.</p>
        </section>
      </OnboardingPage>
    );
  }

  if (step === 4) {
    return (
      <ReleasesContext.Provider value={releases}>
      <Platform
        view={view}
        setView={setView}
        selected={selected}
        setSelectedId={setSelectedId}
        role={role}
        setRole={setRole}
        github={github}
        linear={linear}
        projects={workspaceProjects}
        activeProject={activeProject}
        activeProjectId={activeProjectId}
        selectProject={selectProject}
        addProject={addProject}
        focusDraft={focusDraft}
        setFocusDraft={setFocusDraft}
        saveFocus={saveFocus}
        focusSaved={focusSaved}
        projectNotice={projectNotice}
      />
      </ReleasesContext.Provider>
    );
  }

  return (
    
    <section className="split">
      <aside className="left-panel">
        <MagnetLines
          rows={10}
          columns={10}
          containerSize="min(560px, 72vw)"
          lineColor="rgba(96, 165, 250, 0.22)"
          lineWidth="2px"
          lineHeight="28px"
          baseAngle={-18}
          className="onboarding-magnet"
        />
        <Brand />
        <section className="hero-copy">
          <span className="chip">Release intelligence</span>
          <h1>Know what shipped,<br />why it matters.</h1>
          <p>Bridgr turns ABM product releases into account impact, rollout state, and the next action for product and customer teams.</p>
          <ul>
            <li>Version history across every codebase</li>
            <li>Account coverage in plain English</li>
            <li>Developer-approved summaries before PMs act</li>
          </ul>
        </section>
        <p className="fine">Built for teams where release notes drive support, sales, and customer decisions.</p>
      </aside>
      <main className="right-panel">
        <section className="stack">
          <div className="step-inline"><Dots step={1} /><span>Step 1 of 3</span></div>
          <header>
          <h1>Choose your role</h1>
          <p>We'll tune the release feed for how you use it. You can switch anytime.</p>
          </header>
          <RoleCard
            selected={role === "Founder / PM"}
            icon={<UserCircle size={16} />}
            title="I'm a Founder or PM"
            body="I need to know what changed, which accounts are affected, and whether success or sales needs to act."
            onClick={() => setRole("Founder / PM")}
          />
          <RoleCard
            selected={role === "Developer"}
            icon={<Code2 size={16} />}
            title="I'm a Developer"
            body="I ship the release. I want the summary to be accurate before the team uses it."
            onClick={() => setRole("Developer")}
          />
          <button className="button primary" onClick={() => setStep(2)}>Continue →</button>
          <p className="fine center">Already have an account? <button>Sign in</button></p>
        </section>
      </main>
    </section>
    
  );
}

function Platform({
  view,
  setView,
  selected,
  setSelectedId,
  role,
  setRole,
  github,
  linear,
  projects,
  activeProject,
  activeProjectId,
  selectProject,
  addProject,
  focusDraft,
  setFocusDraft,
  saveFocus,
  focusSaved,
  projectNotice
}: {
  view: View;
  setView: (view: View) => void;
  selected: Release;
  setSelectedId: (id: string) => void;
  role: Role;
  setRole: (role: Role) => void;
  github: boolean;
  linear: boolean;
  projects: WorkspaceProject[];
  activeProject: WorkspaceProject;
  activeProjectId: string;
  selectProject: (id: string) => void;
  addProject: () => void;
  focusDraft: string;
  setFocusDraft: (focus: string) => void;
  saveFocus: () => void;
  focusSaved: boolean;
  projectNotice: string;
}) {
  return (
    <main className="platform">
      <aside className="side">
        <Brand />
        <section className="project-switcher">
          <p className="label">Project</p>
          <select value={activeProjectId} onChange={(event) => selectProject(event.target.value)} aria-label="Switch project">
            {projects.map((item) => (
              <option value={item.id} key={item.id}>{item.name}</option>
            ))}
          </select>
          <small className={projectNotice ? "project-notice" : ""} aria-live="polite">
            {projectNotice || `${activeProject.description} · ${activeProject.codebases.length} codebases`}
          </small>
          <button type="button" className="add-project" onClick={addProject}><Plus size={13} /> New project</button>
        </section>
        {[
          ["feed", "Release Feed"],
          ["review", "Dev Review"],
          ["customers", "Accounts"],
          ["alignment", "Action Needed"]
        ].map(([key, label]) => (
          <button className={view === key ? "active" : ""} key={key} onClick={() => setView(key as View)}>{label}</button>
        ))}
        <section className="integration-state">
          <p className="label">Sources</p>
          <span><i className={github ? "good" : ""} /> GitHub {github ? "connected" : "sample data"}</span>
          <span><i className={linear ? "good" : ""} /> Linear {linear ? "connected" : "optional"}</span>
        </section>
      </aside>
      {view === "review" ? (
        <Review role={role} />
      ) : view === "customers" ? (
        <Customers />
      ) : view === "alignment" ? (
        <Alignment activeProject={activeProject} />
      ) : (
        <ReleaseFeed
          selected={selected}
          setSelectedId={setSelectedId}
          setView={setView}
          activeProject={activeProject}
          focusDraft={focusDraft}
          setFocusDraft={setFocusDraft}
          saveFocus={saveFocus}
          focusSaved={focusSaved}
        />
      )}
    </main>
  );
}

function ReleaseFeed({
  selected,
  setSelectedId,
  setView,
  activeProject,
  focusDraft,
  setFocusDraft,
  saveFocus,
  focusSaved
}: {

  selected: Release;
  setSelectedId: (id: string) => void;
  setView: (view: View) => void;
  activeProject: WorkspaceProject;
  focusDraft: string;
  setFocusDraft: (focus: string) => void;
  saveFocus: () => void;
  focusSaved: boolean;
}) {
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [plannedActions, setPlannedActions] = useState<string[]>([]);

  const releases = useContext(ReleasesContext);
  const visibleReleases = useMemo(() => {
    const scopedReleases = releases.filter((release) => activeProject.codebases.includes(release.repo));
    return scopedReleases.length ? scopedReleases : releases;
  }, [activeProject.codebases]);

  const currentRelease = visibleReleases.find((release) => release.id === selected.id) ?? visibleReleases[0];
  const blockedRelease = visibleReleases.find((release) => release.status === "Blocked");
  const actionPlanned = plannedActions.includes(currentRelease.id);

  const counts = useMemo(() => {
    return {
      shipped: visibleReleases.filter((release) => release.status === "Live" || release.status === "Ready").length,
      staged: visibleReleases.filter((release) => release.rollout !== "100%").length,
      blocked: visibleReleases.filter((release) => release.status === "Blocked").length,
      review: visibleReleases.filter((release) => release.status === "Review").length
    };
  }, [visibleReleases]);

  const signalState = counts.blocked || activeProject.status === "Watch"
    ? "watch"
    : activeProject.status === "Blocked"
      ? "blocked"
      : "on-track";
  const signalDot = signalState === "on-track" ? "green-dot" : signalState === "blocked" ? "red-dot" : "amber-dot";
  const signalLabel = counts.blocked ? "Watch" : activeProject.status;

  const filteredReleases = useMemo(() => {
    if (filter === "attention") return visibleReleases.filter((release) => release.status === "Blocked" || release.status === "Review");
    if (filter === "staged") return visibleReleases.filter((release) => release.rollout !== "100%");
    if (filter === "live") return visibleReleases.filter((release) => release.status === "Live" || release.status === "Ready");
    return visibleReleases;
  }, [filter, visibleReleases]);

  return (
    <section className="work release-work">
      <header className="work-head">
        <div>
          <p className="label">Product status</p>
          <h1>Release feed</h1>
          <p>{activeProject.name} releases across connected codebases, written as customer impact.</p>
        </div>
      </header>

      <BorderGlow
        className="signal-glow"
        backgroundColor="#101010"
        glowColor="210 95 68"
        glowIntensity={0.18}
        glowRadius={18}
        edgeSensitivity={44}
        fillOpacity={0.03}
        colors={["#60A5FA", "#22C55E", "#F0F0F0"]}
      >
        <section className={`release-signal state-${signalState} ${focusSaved ? "is-saved" : ""}`}>
          <span className={`health-dot ${signalDot}`} />
          <div className="signal-body">
            <div className="signal-topline">
              <p><strong>{signalLabel}</strong><span>{counts.shipped} shipped · {counts.blocked} blocked · {activeProject.name}</span></p>
              <button onClick={() => setView("alignment")}>View action needed →</button>
            </div>
            <p className="signal-reason">{blockedRelease ? `${activeProject.focus} ${blockedRelease.title}.` : `${activeProject.focus} No blocked release in watched codebases.`}</p>
            <div className="signal-metrics" aria-label="Release status counts">
              <span><b>{counts.staged}</b> partial rollouts</span>
              <span><b>{counts.blocked}</b> customer action</span>
              <span><b>{counts.review}</b> waiting approval</span>
            </div>
            <div className="signal-focus">
              <textarea value={focusDraft} onChange={(event) => setFocusDraft(event.target.value)} aria-label="This week's product focus" />
              <button className={focusSaved ? "button primary confirm-button" : "button ghost"} type="button" onClick={saveFocus} disabled={!focusDraft.trim()}>
                {focusSaved && <Check size={14} />}
                {focusSaved ? "Focus saved" : "Save focus"}
              </button>
            </div>
          </div>
        </section>
      </BorderGlow>

      <section className="feed-grid">
        <BorderGlow
          key={currentRelease.id}
          className={`detail-shell status-${statusClass[currentRelease.status]} ${currentRelease.status === "Blocked" || currentRelease.status === "Review" ? "needs-attention" : ""}`}
          backgroundColor="#111111"
          glowColor={currentRelease.status === "Blocked" ? "0 84 62" : currentRelease.status === "Review" ? "38 92 50" : "142 71 45"}
          glowIntensity={currentRelease.status === "Blocked" || currentRelease.status === "Review" ? 0.26 : 0.16}
          glowRadius={18}
          edgeSensitivity={42}
          fillOpacity={0.04}
          colors={currentRelease.status === "Blocked" ? ["#EF4444", "#F0F0F0", "#60A5FA"] : currentRelease.status === "Review" ? ["#F59E0B", "#F0F0F0", "#60A5FA"] : ["#60A5FA", "#22C55E", "#F0F0F0"]}
        >
          <section className="release-detail">
            <div className="detail-top">
              <span className={`status ${statusClass[currentRelease.status]}`}>{currentRelease.status}</span>
              <h2>{currentRelease.title}</h2>
              <p>{currentRelease.repo} {currentRelease.version} · {currentRelease.channel}</p>
            </div>
            <div className="release-meta-strip">
              <span><Radio size={13} /> {currentRelease.rollout} rollout</span>
              <span>{currentRelease.customerCoverage}</span>
              <span>{currentRelease.customers}</span>
            </div>
            <div className="briefing-grid">
              <Impact className="briefing-main" label="What changed" body={currentRelease.meaning} />
              <Impact label="Affected accounts" body={currentRelease.affected} />
              <Impact label="Next action" body={currentRelease.action} />
            </div>
            <section className="release-evidence">
              <div>
                <p className="label">Engineer note</p>
                <p>{currentRelease.raw}</p>
              </div>
              <div>
                <p className="label">Risk if ignored</p>
                <p>{currentRelease.cost}</p>
              </div>
            </section>
            <footer className="approval-bar">
              <span><Check size={14} /> Approved by {currentRelease.owner}</span>
              <span>PM owner: {currentRelease.pm}</span>
            </footer>
            <section className={`decision-bar ${actionPlanned ? "is-planned" : ""}`}>
              <div>
                <p className="label">PM decision</p>
                <p>{actionPlanned ? "Success can act from this release. The next step is now part of the record." : "Decide whether customer teams need to act on this release."}</p>
              </div>
              <button
                className={actionPlanned ? "button primary confirm-button" : "button ghost"}
                type="button"
                onClick={() => setPlannedActions((items) => items.includes(currentRelease.id) ? items.filter((id) => id !== currentRelease.id) : [...items, currentRelease.id])}
              >
                {actionPlanned && <Check size={14} />}
                {actionPlanned ? "Action planned" : "Plan customer action"}
              </button>
            </section>
          </section>
        </BorderGlow>

        <section className="release-list-card">
          <div className="section-title">
            <p className="label">Version history</p>
            <span>{filteredReleases.length} releases</span>
          </div>
          <div className="feed-filters" aria-label="Release filters">
            {[
              ["all", "All"],
              ["attention", "Needs action"],
              ["staged", "Partial rollout"],
              ["live", "Live"]
            ].map(([key, label]) => (
              <button key={key} className={filter === key ? "selected" : ""} aria-pressed={filter === key} onClick={() => setFilter(key as FeedFilter)}>{label}</button>
            ))}
          </div>
          <div className="release-list">
            {filteredReleases.map((release, index) => (
              <button
                className={`release-row ${currentRelease.id === release.id ? "selected" : ""}`}
                aria-current={currentRelease.id === release.id ? "true" : undefined}
                data-status={statusClass[release.status]}
                key={release.id}
                onClick={() => setSelectedId(release.id)}
                style={{ "--i": Math.min(index, 5) } as React.CSSProperties}
              >
                <span>
                  <b>{release.repo}</b>
                  <em>{release.version} · {release.channel}</em>
                </span>
                <strong>{release.title}</strong>
                <small>{release.rollout} rollout · {release.customers}</small>
                <i className={`status ${statusClass[release.status]}`}>{release.status}</i>
              </button>
            ))}
          </div>
        </section>
      </section>
    </section>
    
  );
}

function Review({ role }: { role: Role }) {
  const releases = useContext(ReleasesContext);
  const [approved, setApproved] = useState<string[]>([]);

  return (
    <section className="work">
      <header className="work-head">
        <div>
          <p className="label">Developer check</p>
          <h1>Approve release summaries</h1>
          <p>{role === "Developer" ? "Confirm what product will read. Your work stays visible without another status update." : "Developers approve each summary before it becomes company context."}</p>
        </div>
      </header>
      <section className="review-grid">
        {releases.filter((release) => release.status === "Review" || release.status === "Blocked").map((release, index) => (
          <article className="card review-card" data-status={statusClass[release.status]} key={release.id} style={{ "--i": Math.min(index, 5) } as React.CSSProperties}>
            <span className={`status ${statusClass[release.status]}`}>{release.status}</span>
            <h2>{release.title}</h2>
            <p className="raw">{release.raw}</p>
            <p>{release.meaning}</p>
            {role === "Founder / PM" ? (
              <p className="review-state"><span className="health-dot amber-dot" /> Waiting for {release.owner}'s approval</p>
            ) : (
              <button className="button primary" onClick={() => setApproved((items) => items.includes(release.id) ? items : [...items, release.id])}>
                {approved.includes(release.id) ? "Summary approved" : "Approve summary"}
              </button>
            )}
          </article>
        ))}
      </section>
    </section>
    
  );
}

function Customers() {
  const releases = useContext(ReleasesContext);
  return (
    <section className="work">
      <header className="work-head">
        <div>
          <p className="label">Affected accounts</p>
          <h1>Which accounts are affected</h1>
          <p>Support can see what changed for each account group without opening GitHub.</p>
        </div>
      </header>
      <section className="coverage-table">
        <div className="coverage-header">
          <span>Codebase</span>
          <span>Version</span>
          <span>Scope</span>
          <span>Rollout</span>
          <span>What changed</span>
          <span>Status</span>
        </div>
        {releases.map((release, index) => (
          <article key={release.id} data-status={statusClass[release.status]} style={{ "--i": Math.min(index, 5) } as React.CSSProperties}>
            <span data-label="Codebase">{release.repo}</span>
            <strong data-label="Version">{release.version}</strong>
            <p data-label="Scope">{release.customerCoverage}</p>
            <em data-label="Rollout">{release.rollout}</em>
            <small data-label="Change">{release.title}</small>
            <i className={`status ${statusClass[release.status]}`}>{release.status}</i>
          </article>
        ))}
      </section>
    </section>
    
  );
}

function Alignment({ activeProject }: { activeProject: WorkspaceProject }) {
  const releases = useContext(ReleasesContext);
  const visibleReleases = releases.filter((release) => activeProject.codebases.includes(release.repo));
  const blocked = visibleReleases.find((release) => release.status === "Blocked");

  if (!blocked) {
    return (
      <section className="work">
        <header className="work-head">
          <div>
            <p className="label">Action needed</p>
            <h1>No blocked release in this project</h1>
            <p>{activeProject.name} has no watched release that needs customer action right now.</p>
          </div>
        </header>
        <article className="drift-card clear-card">
          <span className="status green">Clear</span>
          <h2>{activeProject.focus}</h2>
          <p>Keep watching the release feed for rollout changes, approval requests, and customer-facing risk.</p>
        </article>
      </section>
    );
  }

  return (
    <section className="work">
      <header className="work-head">
        <div>
          <p className="label">Action needed</p>
          <h1>Where a release needs action</h1>
          <p>One customer-facing issue, the affected accounts, and the next move.</p>
        </div>
      </header>
      <article className="drift-card">
        <span className="status red">Action needed</span>
        <h2>{blocked.title}</h2>
        <p>{blocked.meaning}</p>
        <div className="impact-grid">
          <Impact label="Product focus" body={activeProject.focus} />
          <Impact label="Affected accounts" body={blocked.affected} />
          <Impact label="Next action" body={blocked.action} />
        </div>
      </article>
    </section>
    
  );
}

function Impact({ label, body, className = "" }: { label: string; body: string; className?: string }) {
  return <article className={className}><p className="label">{label}</p><p>{body}</p></article>;
}

function Brand() {
  return <div className="brand"><span>◎</span><strong>Bridgr</strong></div>;
}

function Dots({ step, complete = false }: { step: number; complete?: boolean }) {
  return (
    <div className="dots">
      {[1, 2, 3].map((item) => <i key={item} className={complete || item === step ? "active" : ""} />)}
    </div>
  );
}

function RoleCard({ selected, icon, title, body, onClick }: { selected: boolean; icon: React.ReactNode; title: string; body: string; onClick: () => void }) {
  return (
    <button className={`role-card ${selected ? "selected" : ""}`} onClick={onClick}>
      <span className="role-top"><span className="icon-box">{icon}</span>{selected && <span className="check"><Check size={11} /></span>}</span>
      <strong>{title}</strong>
      <span>{body}</span>
    </button>
  );
}

function OnboardingPage({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <section className="page">
      <header className="topbar-simple"><Brand /><span>Step {step} of 3</span></header>
      <main className="center">{children}</main>
    </section>
    
  );
}

function ConnectionCard({ icon, title, chip, side, rows, footer, muted = false }: { icon: React.ReactNode; title: string; chip: string; side?: string; rows: Array<[string, boolean]>; footer: string; muted?: boolean }) {
  return (
    <article className={`connection ${muted ? "muted" : ""}`}>
      <header>
        <div>{icon}<strong>{title}</strong><span className={muted ? "tag" : "tag green"}>{chip}</span></div>
        {side && <span>{side}</span>}
      </header>
      <section>
        {rows.map(([text, allowed]) => (
          <p key={text}><span><i className={allowed ? "good" : "bad"} /> <em className={allowed ? "" : "denied"}>{text}</em></span><b>{allowed ? "✓" : "×"}</b></p>
        ))}
      </section>
      <footer>{footer}</footer>
    </article>
  );
}
