#!/usr/bin/env python3
"""Demand-side metrics snapshot for solid-fx (Phase A gates).

Pulls public GitHub traffic + repo stats and appends a dated record to
metrics/DEMAND.md. Run weekly (or before roadmap decisions):

    python3 scripts/traffic-snapshot.py

Reads GITHUB_TOKEN (or GH_TOKEN) if set; falls back to unauthenticated
(low rate limit). Traffic APIs need push access — run as the maintainer.
"""
import datetime
import json
import os
import subprocess
import sys

REPO = "WyattAu/solid-fx"
LEDGER = os.path.join(os.path.dirname(__file__), "..", "metrics", "DEMAND.md")

PHASE_C_TRIGGER = ("Phase C (maintenance mode) triggers if stars < 10 and "
                   "external issues == 0 on 2027-01-15.")


def gh(path: str):
    """Call the GitHub API via the gh CLI (auth handled by gh)."""
    url = f"repos/{REPO}/{path}".rstrip("/")
    out = subprocess.run(
        ["gh", "api", url, "--jq", "."],
        capture_output=True, text=True, timeout=30,
    )
    if out.returncode != 0:
        return None
    return json.loads(out.stdout)


def main() -> int:
    today = datetime.date.today().isoformat()
    repo = gh("") or {}
    views = gh("traffic/views") or {}
    clones = gh("traffic/clones") or {}
    referrers = gh("traffic/popular/referrers") or []
    paths = gh("traffic/popular/paths") or []

    stars = repo.get("stargazers_count", "?")
    forks = repo.get("forks_count", "?")
    issues = repo.get("open_issues_count", "?")
    watchers = repo.get("subscribers_count", "?")

    # Non-github referrers = evidence of inbound links (Phase A gate)
    inbound = [r for r in referrers if r.get("referrer", "") not in ("", "github.com")]

    os.makedirs(os.path.dirname(LEDGER), exist_ok=True)
    header = False
    if not os.path.exists(LEDGER):
        header = True
    with open(LEDGER, "a", encoding="utf-8") as f:
        if header:
            f.write("# Demand ledger\n\n"
                    f"{PHASE_C_TRIGGER}\n\n"
                    "Snapshot of public demand signals. Clones are "
                    "dominated by this repo's own CI — read the *uniques* "
                    "delta and non-github referrers instead.\n\n"
                    "| date | stars | forks | watchers | ext-issues | "
                    "views14d | uniques14d | inbound referrers |\n"
                    "| --- | --- | --- | --- | --- | --- | --- | --- |\n")
        f.write(
            f"| {today} | {stars} | {forks} | {watchers} | {issues} | "
            f"{views.get('count', '?')} | {views.get('uniques', '?')} | "
            f"{'; '.join(r['referrer'] + ':' + str(r['count']) for r in inbound) or 'none'} |\n"
        )

    print(f"{today}: stars={stars} forks={forks} issues={issues} "
          f"views={views.get('count', '?')} uniques={views.get('uniques', '?')} "
          f"inbound={len(inbound)}")
    if paths:
        top = paths[0]
        print(f"top path: {top.get('path')} ({top.get('count')})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
