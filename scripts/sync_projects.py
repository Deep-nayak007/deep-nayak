"""Build static project cards from public GitHub repositories; no dependencies."""

import base64
from datetime import datetime
from html import escape
import json
import os
from pathlib import Path
import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
OWNER = "Deep-nayak007"
START = "        <!-- PROJECTS:START -->"
END = "        <!-- PROJECTS:END -->"


def github_json(path, optional=False):
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "deep-nayak-portfolio",
    }
    token = os.environ.get("GH_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    for attempt in range(3):
        try:
            with urlopen(Request(f"https://api.github.com{path}", headers=headers), timeout=30) as response:
                return json.load(response)
        except HTTPError as error:
            if optional and error.code == 404:
                return None
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
        except (URLError, TimeoutError):
            if attempt == 2:
                raise
        time.sleep(2 ** attempt)


def public_repositories():
    repos = []
    page = 1
    while True:
        batch = github_json(f"/users/{OWNER}/repos?per_page=100&sort=pushed&page={page}")
        if not isinstance(batch, list):
            raise ValueError("GitHub did not return a repository list")
        repos.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    if not repos:
        raise ValueError("Refusing to replace projects with an empty repository list")
    return repos


def readme_description(name):
    readme = github_json(f"/repos/{OWNER}/{quote(name, safe='')}/readme", optional=True)
    if not readme:
        return "Explore the source code and project files on GitHub."
    body = base64.b64decode(readme["content"]).decode("utf-8", errors="replace")
    body = re.sub(r"```.*?```", "", body, flags=re.S)
    body = re.sub(r"<!--.*?-->", "", body, flags=re.S)
    for paragraph in re.split(r"\n\s*\n", body):
        paragraph = paragraph.strip()
        if not paragraph or paragraph.startswith(("#", "!", "[", "|", "<", "-", "*", ">")):
            continue
        paragraph = re.sub(r"!?\[([^]]*)\]\([^)]*\)", r"\1", paragraph)
        paragraph = re.sub(r"<[^>]+>", "", paragraph)
        paragraph = re.sub(r"[*_`]", "", paragraph)
        paragraph = " ".join(paragraph.split())
        if len(paragraph) >= 35:
            return paragraph if len(paragraph) <= 240 else paragraph[:237].rsplit(" ", 1)[0] + "…"
    return "Explore the source code and project files on GitHub."


def web_url(value):
    if not value:
        return None
    parsed = urlparse(value)
    if parsed.scheme in ("http", "https") and parsed.hostname and not parsed.username:
        return value
    return None


def build_projects(repos, config):
    excluded = {name.casefold() for name in config["exclude"]}
    overrides = {name.casefold(): item for name, item in config["projects"].items()}
    projects = []
    for repo in repos:
        if repo.get("private") or repo.get("archived") or repo.get("disabled"):
            continue
        name = repo["name"]
        if name.casefold() in excluded:
            continue
        custom = overrides.get(name.casefold(), {})
        description = custom.get("description") or repo.get("description") or readme_description(name)
        updated = datetime.fromisoformat(repo["pushed_at"].replace("Z", "+00:00"))
        projects.append({
            "name": name,
            "title": custom.get("title", name.replace("-", " ").replace("_", " ")),
            "description": description,
            "category": custom.get("category", "Other Projects"),
            "stack": custom.get("stack") or ([repo["language"]] if repo.get("language") else []),
            "url": f"https://github.com/{OWNER}/{quote(name, safe='')}",
            "demo": web_url(custom.get("demo") or repo.get("homepage")),
            "updated": updated.isoformat(),
            "date": updated.strftime("%b %Y"),
        })
    if not projects:
        raise ValueError("Refusing to publish an empty project collection")
    return sorted(projects, key=lambda item: (item["updated"], item["name"].casefold()), reverse=True)


def render_card(project):
    p = {key: escape(str(value), quote=True) for key, value in project.items()}
    stack = "\n".join(f'              <span class="proj-stat">{escape(tag)}</span>' for tag in project["stack"])
    demo = (f'              <a class="proj-link" href="{p["demo"]}" target="_blank" rel="noopener noreferrer" '
            f'aria-label="Open {p["title"]} live demo">Live Demo</a>') if project["demo"] else ""
    return f'''          <article class="proj-card" data-category="{p['category']}">
            <div class="speed-lines" aria-hidden="true"></div>
            <div class="proj-meta"><p class="proj-tag">{p['category']}</p></div>
            <h3 class="proj-name">{p['title']}</h3>
            <p class="proj-repo">{p['name']}</p>
            <p class="proj-desc">{p['description']}</p>
            <div class="proj-stats">
{stack}
            </div>
            <div class="proj-footer">
              <p class="proj-updated">Updated <time datetime="{p['updated']}">{p['date']}</time></p>
              <div class="proj-links">
                <a class="proj-link" href="{p['url']}" target="_blank" rel="noopener noreferrer" aria-label="View {p['title']} on GitHub">View Code</a>
{demo}
              </div>
            </div>
          </article>'''


def render_projects(projects):
    categories = sorted({project["category"] for project in projects})
    options = "\n".join(f'              <option value="{escape(category, quote=True)}">{escape(category)}</option>' for category in categories)
    cards = "\n\n".join(render_card(project) for project in projects)
    return f'''{START}
        <div class="projects-heading">
          <div>
            <p class="sector-label">// SECTOR 03</p>
            <h2 class="section-title">Engineering Projects</h2>
            <p class="projects-intro">From my public GitHub repositories. Latest work first, from AI experiments to full-stack applications.</p>
          </div>
          <a class="projects-github" href="https://github.com/{OWNER}?tab=repositories" target="_blank" rel="noopener noreferrer">Explore GitHub <span aria-hidden="true">↗</span></a>
        </div>
        <div class="projects-toolbar" id="projectControls" hidden>
          <div class="project-search">
            <label for="projectSearch">Find a project</label>
            <input id="projectSearch" type="search" placeholder="Search projects or technologies" autocomplete="off" />
          </div>
          <div class="project-category">
            <label for="projectCategory">Focus area</label>
            <select id="projectCategory">
              <option value="">All areas</option>
{options}
            </select>
          </div>
        </div>
        <p class="projects-count" id="projectCount" role="status" aria-live="polite" aria-atomic="true">{len(projects)} projects · Refreshed daily from GitHub</p>
        <div class="projects-grid" id="projectGrid">
{cards}
        </div>
        <p class="projects-empty" id="projectEmpty" hidden>No matching projects. Try another name, technology, or focus area.</p>
        <div class="projects-more">
          <button class="btn btn-secondary" id="projectShowMore" type="button" aria-controls="projectGrid" hidden>Show all projects</button>
        </div>
{END}'''


def main():
    config = json.loads((ROOT / "data/project-overrides.json").read_text())
    projects = build_projects(public_repositories(), config)
    index = ROOT / "index.html"
    content = index.read_text()
    if content.count(START) != 1 or content.count(END) != 1:
        raise ValueError("Expected exactly one pair of project markers in index.html")
    before, remainder = content.split(START, 1)
    _, after = remainder.split(END, 1)
    index.write_text(before + render_projects(projects) + after)
    print(f"Synced {len(projects)} public projects, newest: {projects[0]['name']}")


if __name__ == "__main__":
    main()
