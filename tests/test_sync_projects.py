import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


spec = importlib.util.spec_from_file_location("sync_projects", Path(__file__).resolve().parents[1] / "scripts/sync_projects.py")
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


def repo(name, **extra):
    return {"name": name, "pushed_at": "2026-11-01T12:00:00Z", "description": "A public project description.", "language": "Python", **extra}


class ProjectSyncTests(unittest.TestCase):
    def test_only_eligible_public_repositories_are_included(self):
        repos = [repo("Public"), repo("Private", private=True), repo("Archived", archived=True), repo("Disabled", disabled=True), repo("practice")]
        projects = sync.build_projects(repos, {"exclude": {"PRACTICE": "practice"}, "projects": {}})
        self.assertEqual([project["name"] for project in projects], ["Public"])

    def test_new_projects_sort_first(self):
        projects = sync.build_projects([repo("Older"), repo("Newer", pushed_at="2026-11-20T12:00:00Z")], {"exclude": {}, "projects": {}})
        self.assertEqual([project["name"] for project in projects], ["Newer", "Older"])

    def test_unknown_project_uses_github_metadata(self):
        project = sync.build_projects([repo("new-project", homepage="https://example.com/demo")], {"exclude": {}, "projects": {}})[0]
        self.assertEqual(project["description"], "A public project description.")
        self.assertEqual(project["stack"], ["Python"])
        self.assertEqual(project["demo"], "https://example.com/demo")
        self.assertEqual(project["category"], "Other Projects")

    def test_readme_fallback_for_new_repository_without_description(self):
        with patch.object(sync, "github_json", return_value={"content": "IyBOZXcgcHJvamVjdAoKVGhpcyBpcyBhIG5ldyBwcm9qZWN0IHdpdGggYSB1c2VmdWwgcHVibGljIGRlc2NyaXB0aW9uLg=="}):
            project = sync.build_projects([repo("new-project", description=None)], {"exclude": {}, "projects": {}})[0]
        self.assertEqual(project["description"], "This is a new project with a useful public description.")

    def test_repository_text_is_escaped_and_unsafe_demo_links_are_rejected(self):
        project = sync.build_projects([repo("test", description='<script>alert("x")</script>', homepage="javascript:alert(1)")], {"exclude": {}, "projects": {}})[0]
        html = sync.render_card(project)
        self.assertIn("&lt;script&gt;", html)
        self.assertNotIn("<script>", html)
        self.assertNotIn("Live Demo", html)
        self.assertIsNone(sync.web_url("https://user:password@example.com"))

    def test_api_pagination_fetches_every_page(self):
        first_page = [repo(f"project-{index}") for index in range(100)]
        with patch.object(sync, "github_json", side_effect=[first_page, [repo("last")]]) as api:
            self.assertEqual(len(sync.public_repositories()), 101)
        self.assertIn("page=2", api.call_args.args[0])

    def test_empty_api_result_is_rejected(self):
        with patch.object(sync, "github_json", return_value=[]):
            with self.assertRaises(ValueError):
                sync.public_repositories()

    def test_api_failure_leaves_existing_page_untouched(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "data").mkdir()
            (root / "data/project-overrides.json").write_text('{"exclude": {}, "projects": {}}')
            index = root / "index.html"
            index.write_text("Existing project cards")
            with patch.object(sync, "ROOT", root), patch.object(sync, "public_repositories", side_effect=RuntimeError("API unavailable")):
                with self.assertRaises(RuntimeError):
                    sync.main()
            self.assertEqual(index.read_text(), "Existing project cards")


if __name__ == "__main__":
    unittest.main()
