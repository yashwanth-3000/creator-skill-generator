from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from app.config import Settings
from app.schemas import (
    GenerateSkillRequest,
    GeneratedFile,
)
from app.service import SkillGenerationService, _slugify


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _make_files() -> list[GeneratedFile]:
    """A realistic file list similar to what the new crew runner produces."""
    return [
        GeneratedFile(
            relative_path="SKILL.md",
            content=(
                "---\n"
                "name: short-form-repurpose-engine\n"
                'description: "Turn long-form creator videos into short-form assets."\n'
                "---\n\n"
                "# Short Form Repurpose Engine\n\n"
                "Repurpose a YouTube video into shorts, tweets, and newsletter angles.\n"
                "Read `references/framework.md` for the full method.\n\n"
                "## Framework at a Glance\n\n"
                "**Core Promise:** One-sentence thesis from the video.\n"
                "**Sharp Moments:** 5-7 standalone clips.\n"
                "**Hook Rewrite:** Native short-form openers.\n"
                "**Three Outputs:** Short script + tweet + newsletter angle.\n\n"
                "## Hard Constraints\n\n"
                "- No generic hooks like 'stop scrolling'\n"
                "- No invented stories, stats, or examples\n"
                "- All outputs tied to the same central claim\n"
                "- Flag missing context instead of filling gaps\n\n"
                "## Output Format\n\n"
                "For each sharp moment:\n"
                "1. Short script (30-45 seconds)\n"
                "2. Tweet/thread starter\n"
                "3. Newsletter angle paragraph\n\n"
                "## References\n\n"
                "- `references/framework.md` — Full repurposing method\n"
                "- `references/examples.md` — Annotated good and bad examples\n"
                "- `references/sources.md` — Creator vocabulary and banned phrases\n"
            ),
        ),
        GeneratedFile(
            relative_path="references/framework.md",
            content=(
                "# Short-Form Repurposing Framework\n\n"
                "## Purpose\n"
                "Full operating method for turning a long-form creator video into publishable short-form assets.\n\n"
                "## Step 1 — Extract the Core Promise\n"
                "Watch or read the full transcript. Identify the single sentence that captures the video's thesis.\n"
                "The core promise must be specific, not generic.\n\n"
                "## Step 2 — Identify Sharp Moments\n"
                "Pull 5-7 moments that can stand alone without the full episode context.\n"
                "Criteria: makes a specific claim, has tension, understandable without prior setup.\n\n"
                "## Step 3 — Rewrite Hooks\n"
                "For each sharp moment, rewrite the opening so it lands in the first 2 seconds.\n"
                "Rules:\n"
                "- Must sound native to short-form, not clipped from a podcast\n"
                "- Use the creator's real point of view\n"
                "- Banned: 'stop scrolling', 'three tips', 'you need to hear this'\n\n"
                "## Step 4 — Map to Three Outputs\n"
                "For each moment:\n"
                "1. A 30-45 second short script\n"
                "2. A tweet or thread starter\n"
                "3. A one-paragraph newsletter angle\n\n"
                "## Step 5 — Consistency Check\n"
                "All outputs must tie back to the same central claim from Step 1.\n"
                "If any output drifts, rewrite or flag for review.\n\n"
                "## Constraints\n"
                "- Do not invent facts not in the source video\n"
                "- If context is missing, flag it explicitly\n"
                "- Keep the workflow strict and the output format exact\n"
                "- Avoid bloated explanations — the team needs publishable assets\n"
            ),
        ),
        GeneratedFile(
            relative_path="references/examples.md",
            content=(
                "# Repurposing Examples\n\n"
                "## Good Example 1 — Sharp Moment Extraction\n"
                'Source: "AI coding agents are becoming the default workflow."\n'
                'Sharp moment: "Engineers aren\'t typing code line by line. They\'re orchestrating AI agents."\n'
                "Why it works: Specific, standalone, has tension.\n\n"
                "## Good Example 2 — Hook Rewrite\n"
                'Original: "So the next thing I want to talk about is repurposing content."\n'
                'Rewritten: "Your best YouTube video is hiding 7 pieces of unpublished content."\n'
                "Why it works: Leads with a specific claim, creates curiosity, no warm-up.\n\n"
                "## Good Example 3 — Output Mapping\n"
                'Sharp moment: "Every video without repurposing leaves 80% of the value on the table."\n'
                "Short script: [35-second script with hook -> context -> CTA]\n"
                'Tweet: "Most creators publish once and move on. The smart ones extract 7+ assets."\n'
                "Newsletter: Full paragraph expanding the method.\n\n"
                "## Anti-Example 1 — Generic Hook\n"
                'Bad: "Stop scrolling! Here are 3 tips for repurposing content."\n'
                "Why it fails: Banned hook pattern. Not tied to creator's voice.\n\n"
                "## Anti-Example 2 — Invented Stats\n"
                'Bad: "Studies show repurposed content gets 3x more engagement."\n'
                "Why it fails: Invents a statistic not in the source.\n\n"
                "## Flat vs Alive\n\n"
                "| Flat | Alive |\n"
                "|---|---|\n"
                '| "Repurpose your videos." | "Your best video is hiding 7 pieces of content." |\n'
                '| "Use good hooks." | "Rewrite the opening so it lands in 2 seconds." |\n'
                '| "Be consistent." | "All outputs must tie back to the same central claim." |\n'
            ),
        ),
        GeneratedFile(
            relative_path="references/sources.md",
            content=(
                "# Source Material & Creator Voice\n\n"
                "## Source Summary\n"
                "The creator runs a weekly repurposing workflow for a creator-led brand.\n\n"
                "## Key Phrases (verbatim)\n"
                '- "identify the core promise of the video in one sentence"\n'
                '- "pull out 5 to 7 sharp moments that can stand alone"\n'
                '- "rewrite the opening so it lands in the first 2 seconds"\n'
                '- "sounds like a native short-form hook, not a clipped podcast sentence"\n'
                '- "use the creator\'s real point of view"\n'
                '- "keep all outputs tied to the same central claim"\n'
                '- "do not invent stories, stats, or examples"\n'
                '- "if context is missing, flag it"\n'
                '- "my team needs assets they can publish fast"\n\n'
                "## Creator Voice\n"
                "- Direct and operational\n"
                "- Anti-fluff\n"
                "- Constraint-heavy\n"
                "- Team-oriented\n\n"
                "## Banned Phrases\n"
                '- "stop scrolling"\n'
                '- "three tips"\n'
                "- Generic attention-grab hooks\n"
                "- Invented statistics\n\n"
                "## Terminology\n"
                "- core promise: the one-sentence thesis\n"
                "- sharp moments: standalone clips\n"
                "- native short-form hook: written for shorts, not clipped\n"
                "- central claim: the unifying theme\n"
            ),
        ),
        GeneratedFile(
            relative_path="agents/openai.yaml",
            content=(
                "interface:\n"
                '  display_name: "Short Form Repurpose Engine"\n'
                '  short_description: "Turn long-form creator videos into short-form assets."\n'
                '  default_prompt: "Use $short-form-repurpose-engine to repurpose this video."\n'
            ),
        ),
    ]


SKILL_NAME = "short-form-repurpose-engine"


class _StubRunner:
    """Replaces SkillCrewRunner for tests — returns a fixed (name, files) tuple."""

    def __init__(self, skill_name: str, files: list[GeneratedFile]) -> None:
        self._skill_name = skill_name
        self._files = files

    def run(self, request: GenerateSkillRequest) -> tuple[str, list[GeneratedFile]]:
        return self._skill_name, self._files


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestSlugify(unittest.TestCase):
    def test_normal(self) -> None:
        self.assertEqual(_slugify("short-form-repurpose-engine"), "short-form-repurpose-engine")

    def test_spaces_and_caps(self) -> None:
        self.assertEqual(_slugify("My Cool Skill"), "my-cool-skill")

    def test_special_chars(self) -> None:
        self.assertEqual(_slugify("hello_world!!"), "hello-world")


class TestSkillGeneration(unittest.TestCase):
    def setUp(self) -> None:
        self.request = GenerateSkillRequest(
            creator_content=(
                "Here is the workflow I use every week for repurposing a YouTube video "
                "into shorts, tweets, and newsletter angles. First, identify the core "
                "promise of the video in one sentence. Then pull out 5 to 7 sharp moments "
                "that can stand alone without the full episode."
            ),
            content_kind="youtube-script",
            creator_name="Maya Growth Lab",
            desired_skill_name="short-form-repurpose-engine",
            target_outcome="turn a long-form creator script into reusable short-form content assets",
            audience="content operators",
            persist_to_disk=False,
        )
        self.files = _make_files()

    def _make_service(self, tmp: str) -> SkillGenerationService:
        svc = SkillGenerationService(Settings(skill_output_dir=Path(tmp)))
        svc.crew = _StubRunner(SKILL_NAME, self.files)
        return svc

    def test_generate_returns_all_files(self) -> None:
        with TemporaryDirectory() as tmp:
            response = self._make_service(tmp).generate(self.request)
        self.assertEqual(response.skill_name, "short-form-repurpose-engine")
        paths = {f.relative_path for f in response.files}
        self.assertIn("SKILL.md", paths)
        self.assertIn("references/framework.md", paths)
        self.assertIn("references/examples.md", paths)
        self.assertIn("references/sources.md", paths)
        self.assertIn("agents/openai.yaml", paths)

    def test_persist_writes_files_to_disk(self) -> None:
        self.request.persist_to_disk = True
        with TemporaryDirectory() as tmp:
            response = self._make_service(tmp).generate(self.request)
            self.assertIsNotNone(response.output_path)
            out = Path(response.output_path)
            self.assertTrue((out / "SKILL.md").exists())
            self.assertTrue((out / "references" / "framework.md").exists())
            self.assertTrue((out / "references" / "examples.md").exists())
            self.assertTrue((out / "references" / "sources.md").exists())
            self.assertTrue((out / "agents" / "openai.yaml").exists())

    def test_frontmatter_fixed_when_missing(self) -> None:
        files = _make_files()
        files[0] = GeneratedFile(
            relative_path="SKILL.md",
            content="# My Skill\n\nContent.\n\n1. Step one\n2. Step two\n3. Step three\n",
        )
        with TemporaryDirectory() as tmp:
            svc = SkillGenerationService(Settings(skill_output_dir=Path(tmp)))
            svc.crew = _StubRunner(SKILL_NAME, files)
            response = svc.generate(self.request)
        skill_md = next(f.content for f in response.files if f.relative_path == "SKILL.md")
        self.assertTrue(skill_md.startswith("---\n"))
        self.assertIn("name: short-form-repurpose-engine", skill_md)

    def test_openai_yaml_added_when_missing(self) -> None:
        files = [f for f in _make_files() if not f.relative_path.startswith("agents/")]
        with TemporaryDirectory() as tmp:
            svc = SkillGenerationService(Settings(skill_output_dir=Path(tmp)))
            svc.crew = _StubRunner(SKILL_NAME, files)
            response = svc.generate(self.request)
        paths = {f.relative_path for f in response.files}
        self.assertIn("agents/openai.yaml", paths)
        yaml_content = next(f.content for f in response.files if f.relative_path == "agents/openai.yaml")
        self.assertIn("$short-form-repurpose-engine", yaml_content)

    def test_short_references_produce_warnings(self) -> None:
        files = _make_files()
        for i, f in enumerate(files):
            if f.relative_path == "references/sources.md":
                files[i] = GeneratedFile(
                    relative_path="references/sources.md",
                    content="# Sources\n\nToo short.\n",
                )
                break
        with TemporaryDirectory() as tmp:
            svc = SkillGenerationService(Settings(skill_output_dir=Path(tmp)))
            svc.crew = _StubRunner(SKILL_NAME, files)
            response = svc.generate(self.request)
        self.assertTrue(any("sources.md" in w and "short" in w for w in response.warnings))

    def test_no_warnings_for_good_package(self) -> None:
        with TemporaryDirectory() as tmp:
            response = self._make_service(tmp).generate(self.request)
        self.assertEqual(response.warnings, [])


if __name__ == "__main__":
    unittest.main()
