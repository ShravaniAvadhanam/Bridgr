import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add exports to types
content = content.replace('type Step =', 'export type Step =')
content = content.replace('type View =', 'export type View =')
content = content.replace('type ReleaseStatus =', 'export type ReleaseStatus =')
content = content.replace('type FeedFilter =', 'export type FeedFilter =')
content = content.replace('type Role =', 'export type Role =')
content = content.replace('type WorkspaceStatus =', 'export type WorkspaceStatus =')
content = content.replace('type WorkspaceProject =', 'export type WorkspaceProject =')
content = content.replace('type Release =', 'export type Release =')

# 2. Add import for github.ts and useEffect
content = content.replace('import { useMemo, useState } from "react";', 'import { useMemo, useState, useEffect } from "react";\nimport { fetchCommitsAsReleases } from "./github";')

# 3. Add global state for releases that updates components
# Instead of passing props everywhere, we'll create a Context.
context_code = """
import { createContext, useContext } from "react";
export const ReleasesContext = createContext<Release[]>([]);
"""
content = content.replace('import BorderGlow from "./BorderGlow";', context_code + '\nimport BorderGlow from "./BorderGlow";')

# 4. Rename 'const releases: Release[] = [' to 'const mockReleases: Release[] = ['
content = content.replace('const releases: Release[] = [', 'const mockReleases: Release[] = [')

# 5. In App component, add state and context provider
app_code_start = """export function App() {
  const [step, setStep] = useState<Step>(new URLSearchParams(location.search).get("reset") === "1" ? 1 : 4);
  const [role, setRole] = useState<Role>("Founder / PM");
  const [github, setGithub] = useState(false);
  const [githubRepo, setGithubRepo] = useState("ShravaniAvadhanam/Bridgr");
  const [releases, setReleases] = useState<Release[]>(mockReleases);
  const [linear, setLinear] = useState(false);"""
content = re.sub(r'export function App\(\) \{.*?(?=const \[project, setProject\])', app_code_start + '\n  ', content, flags=re.DOTALL)

# 6. Update connect function to fetch
connect_code = """
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
"""
content = re.sub(r'const connect = \(target.*?\}, 650\);\n  \};', connect_code.strip(), content, flags=re.DOTALL)

# 7. Add github repo input to onboarding step 2
repo_input = """
          <header>
            <h1>Connect GitHub</h1>
            <p>Bridgr reads release notes and commit history.</p>
            <label style={{marginTop: '1rem', display: 'block'}}>
              <span>GitHub Repository</span>
              <input style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '4px'}} value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} placeholder="e.g. ShravaniAvadhanam/Bridgr" />
            </label>
          </header>
"""
content = re.sub(r'<header>\n            <h1>Connect GitHub</h1>\n            <p>Bridgr reads release notes.*?</header>', repo_input.strip(), content, flags=re.DOTALL)

# 8. Wrap App return with ReleasesContext.Provider
content = content.replace('return (\n    <section className="split">', 'return (\n    <ReleasesContext.Provider value={releases}>\n    <section className="split">')
content = re.sub(r'</section>\n  \);\n}', '</section>\n    </ReleasesContext.Provider>\n  );\n}', content)

content = content.replace('return (\n      <Platform', 'return (\n      <ReleasesContext.Provider value={releases}>\n      <Platform')
content = content.replace('projectNotice={projectNotice}\n      />\n    );', 'projectNotice={projectNotice}\n      />\n      </ReleasesContext.Provider>\n    );')

# 9. Replace `releases` with `useContext(ReleasesContext)` in all subcomponents
# Platform
content = re.sub(r'function Platform\(\{', 'function Platform({', content)
# It doesn't use releases directly except maybe passing it, wait, Platform doesn't use releases.

# ReleaseFeed
release_feed_start = """function ReleaseFeed({
  selected,
  setSelectedId,
  setView,
  activeProject,
  focusDraft,
  setFocusDraft,
  saveFocus,
  focusSaved
}: {"""
release_feed_new = """function ReleaseFeed({
  selected,
  setSelectedId,
  setView,
  activeProject,
  focusDraft,
  setFocusDraft,
  saveFocus,
  focusSaved
}: {
"""
content = content.replace(release_feed_start, release_feed_new)
content = re.sub(r'const visibleReleases = useMemo\(\(\) => \{', 'const releases = useContext(ReleasesContext);\n  const visibleReleases = useMemo(() => {', content, count=1)

# Review
content = re.sub(r'function Review\(\{ role \}: \{ role: Role \}\) \{', 'function Review({ role }: { role: Role }) {\n  const releases = useContext(ReleasesContext);', content)

# Customers
content = re.sub(r'function Customers\(\) \{', 'function Customers() {\n  const releases = useContext(ReleasesContext);', content)

# Alignment
content = re.sub(r'function Alignment\(\{ activeProject \}: \{ activeProject: WorkspaceProject \}\) \{', 'function Alignment({ activeProject }: { activeProject: WorkspaceProject }) {\n  const releases = useContext(ReleasesContext);', content)

# App function itself uses `releases`
app_selected = 'const selected = releases.find((release) => release.id === selectedId) ?? releases[0];'
app_selected_new = 'const selected = releases.find((release) => release.id === selectedId) ?? releases[0];' # already defined as state `releases` in App so no change needed.

with open('src/App.tsx', 'w') as f:
    f.write(content)
