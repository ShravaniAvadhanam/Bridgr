import { Release } from "./App";

export async function fetchCommitsAsReleases(repoPath: string): Promise<Release[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repoPath}/commits`);
    if (!res.ok) {
      throw new Error(`Failed to fetch commits from ${repoPath}`);
    }
    const data = await res.json();
    const repoName = repoPath.split('/')[1] || repoPath;

    return data.map((item: any, index: number) => {
      const messageLines = item.commit.message.split('\n');
      const title = messageLines[0].substring(0, 80);
      const statuses: Release["status"][] = ["Live", "Review", "Ready", "Blocked"];
      const rollouts = ["100%", "25%", "0%", "100%"];
      
      const idx = index % statuses.length;

      return {
        id: item.sha,
        repo: repoName,
        version: item.sha.substring(0, 7),
        channel: idx === 0 ? "Production" : "Staged rollout",
        status: statuses[idx],
        rollout: rollouts[idx],
        customerCoverage: "All active workspaces",
        customers: `${Math.floor(Math.random() * 50) + 1} accounts`,
        title: title,
        raw: item.commit.message,
        meaning: "AI Translation placeholder: " + title,
        affected: "Customers relying on recent changes.",
        action: "Review customer feedback for anomalies.",
        cost: "Medium trust risk if ignored.",
        owner: item.commit.author?.name || "Developer",
        pm: "Product Manager"
      };
    });
  } catch (err) {
    console.error(err);
    return [];
  }
}
