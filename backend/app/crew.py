from __future__ import annotations

from queue import Queue
from typing import Any

from app.schemas import (
    AgentMeta,
    FileContent,
    GeneratedFile,
    GenerateSkillRequest,
    SkillAnalysis,
)

# ---------------------------------------------------------------------------
# Reference examples — STRUCTURE only (from varun-maya).
# Embedded in prompts so the LLM learns the expected FORMAT and DEPTH,
# but every prompt warns: never copy content from these examples.
# ---------------------------------------------------------------------------

EXAMPLE_SKILL_MD = """\
---
name: varun-maya
description: Write short-form video scripts using the Varun Maya framework.
---

# Varun Maya Script Framework

Write scripts using the structure, rhythm, and language patterns extracted
from Varun Maya's reels. Read `references/framework.md` for the full system
and `references/sources.md` for the source reels.

## The Framework at a Glance

**Hook:** Lead with urgency. Use "just." Create tension in the first line.
**Pivot:** "Here's the full story." — signals value is coming, holds retention.
**Body:** State what happened -> one direct quote -> the twist -> zoom out.
**CTA:** Debate question for divisive topics. DM keyword for utility topics.

## Hard Constraints

- 31-40 seconds. Never over 40.
- No intro, no greeting — word 1 is the hook.
- Second sentence must add NEW info — never restate the hook.
- One specific technical detail per script.

## Output Format

```
[Script text — plain, no section labels]
---
Estimated duration: ~Xs
```

## References

- `references/framework.md` — Full system: hook patterns, sentence rules, body formula, CTA rules
- `references/examples.md` — Annotated script examples showing the framework in action
- `references/sources.md` — Source reels: URLs, full transcripts, patterns per reel
"""

EXAMPLE_FRAMEWORK = """\
# Varun Maya Script Framework
_Extracted from analyzing 9 reels._

## Hook Patterns

**Pattern A — Breaking news drop** (most common)
> "[Big name] just [did shocking thing]."
Key word: **"just"** — urgency + recency in one word. Almost always the opener.

**Pattern B — Contrarian + validation**
> "[Outrageous claim]." -> "[Validates shock]" e.g. "Yeah, he actually said that."
Second line holds the viewer who almost scrolled.

**Pattern C — What if / personal pain**
> "What if there was [thing that solves viewer's exact problem]?"
Opens with the reader's pain, demonstrates solution immediately.

## The 3 Sentence Structure Rules

**Rule 1: Short. Then shorter. Then stop.**
No compound sentences in the first 10 seconds. One idea per sentence.
> "Jack Dorsey just fired half his company because of AI. The stock jumped 25%."

**Rule 2: "Here's the full story" — the pivot phrase**
Use after the hook to transition into the body. Retention anchor.
Variants: "Here's what that actually means." / "Here's why this matters."

**Rule 3: Contrast structure in the body**
Always build two sides. Never just one perspective. Forces comments.
> Old way vs new way. Before vs after. Pro vs con.

## The Body Formula
1. State what happened (10-15s)
2. Include one direct quote — exact words, not paraphrase
3. Add the twist — the unexpected angle that reframes everything
4. Zoom out — what this means for everyone, not just the person in the story

## CTA Rules
- Divisive/debate topics -> "What do you think?" at the end
- Utility/resource topics -> "Comment [WORD] and I'll DM you the link"
- Never end with "follow me for more" unless the whole reel earns it

## Language Patterns to Use
- "just" — urgency word, use in hooks always
- "simply" — makes complex things feel easy
- "basically" — plain English translator after complex point
- "Having said that" — bridge between two sides
- "What's interesting is..." — signals twist is coming
- Zero filler: no "guys", no "hey everyone", no warm-up

## The 7 Core Rules
1. "Just" in every hook — non-negotiable urgency word
2. "Here's the full story/why this matters" after hook — retention anchor
3. One direct quote per script — exact words -> credibility
4. Contrast structure in body — two sides -> comments
5. End with debate question for divisive topics; DM CTA for utility topics
6. Second sentence must add NEW info — never restate the first line
7. "Basically" after complexity — plain English safety net
"""

EXAMPLE_EXAMPLES = """\
# Varun Maya Script Examples
_Annotated examples showing his framework in action._

## Example 1 — Breaking news drop (Pattern A)

> "OpenAI just announced they're building their own chip. And it's not for
> training — it's for inference.
> Here's what that actually means. Right now, every time you use ChatGPT,
> OpenAI pays Nvidia. Billions every year. Their own chip cuts that dependency.
> Having said that, building chips is not like building software. Apple spent
> a decade on the M-series.
> What's interesting is, if OpenAI pulls this off, the cost of running AI
> drops dramatically. For everyone.
> What do you think — is this a threat to Nvidia or just noise?"

**Annotations:**
- Hook: "just" + shocking claim
- Pivot: "Here's what that actually means"
- Body: cost angle (specific detail) -> twist (it's hard) -> zoom out
- CTA: debate question

## Example 2 — Personal pain (Pattern C)

> "What if you could cut your video editing time by 80%? This tool does it.
> Here's the full story. It's called Descript. You edit video by editing text.
> Delete a sentence — the clip disappears. Add a word — it generates your voice.
> Professional editors charge 5,000-15,000 per video. This does the same in
> minutes. For free.
> Basically, it's the difference between spending a weekend on one video versus
> finishing before lunch.
> Comment EDIT and I'll DM you the link."

**Annotations:**
- Hook: Pattern C — personal pain ("cut editing time by 80%")
- Pivot: "Here's the full story"
- Body: specific feature + technical detail + contrast
- CTA: utility -> DM keyword

## Flat vs Alive

| Flat | Alive (Varun style) |
|---|---|
| "OpenAI is making a chip." | "OpenAI just announced they're building their own chip." |
| "This will affect Nvidia." | "Every time you use ChatGPT, OpenAI pays Nvidia. Billions." |
| "It's complicated to build chips." | "Apple spent a decade on the M-series." |
| "This editing tool is useful." | "You edit video by editing text. Delete a sentence — the clip disappears." |
| "Follow for more." | "What do you think — is this a threat to Nvidia or just noise?" |

**The pattern:** Specifics > vague claims. "Just" creates urgency. Numbers make it real.
"""

GROUNDING_WARNING = (
    "\n\n=== CRITICAL GROUNDING RULES ===\n"
    "1. The varun-maya examples above show STRUCTURE and FORMAT only. "
    "Do NOT copy any words, phrases, patterns, or language from them.\n"
    "2. ALL content you write must come from the CREATOR CONTENT below. "
    "If the creator didn't say it, don't include it.\n"
    "3. Never invent quotes, statistics, facts, or examples not in the source.\n"
    "4. Never use varun-maya-specific language (e.g. 'just', 'Here's the full story', "
    "'basically', 'Having said that', 'What's interesting is') UNLESS the creator "
    "actually uses those exact phrases in their content.\n"
    "=== END GROUNDING RULES ===\n\n"
)


# ---------------------------------------------------------------------------
# Helpers for extracting clean log content from CrewAI internals
# ---------------------------------------------------------------------------

def _extract_step_content(step_output: Any) -> str:
    """Pull readable content from an AgentFinish/AgentAction step."""
    import json as _json

    output_str = getattr(step_output, "output", None)
    if output_str is None:
        rv = getattr(step_output, "return_values", None)
        if isinstance(rv, dict):
            output_str = rv.get("output", str(rv))
        else:
            output_str = str(step_output)

    if not isinstance(output_str, str):
        output_str = str(output_str)

    try:
        parsed = _json.loads(output_str)
        if isinstance(parsed, dict):
            if "content" in parsed:
                content = parsed["content"]
                lines = content.split("\\n") if "\\n" in content else content.split("\n")
                header = next((l.strip() for l in lines if l.strip()), "")
                char_count = len(content)
                return f"Generated file ({char_count} chars): {header}"
            if "skill_name" in parsed:
                name = parsed.get("skill_name", "")
                desc = parsed.get("description", "")
                topic = parsed.get("primary_topic", "")
                tone = parsed.get("tone", "")
                phrases = parsed.get("key_phrases", [])
                parts = [f"Analysis complete — {name}"]
                if desc:
                    parts.append(f"Description: {desc}")
                if topic:
                    parts.append(f"Topic: {topic}")
                if tone:
                    parts.append(f"Tone: {tone}")
                if phrases:
                    parts.append(f"Key phrases extracted: {len(phrases)}")
                return "\n".join(parts)
    except (_json.JSONDecodeError, TypeError, ValueError):
        pass

    return output_str


def _extract_task_content(task_output: Any) -> str:
    """Pull readable summary from a completed task output."""
    import json as _json

    pyd = getattr(task_output, "pydantic", None)
    if pyd is not None:
        if hasattr(pyd, "skill_name"):
            return f"{pyd.skill_name}: {getattr(pyd, 'description', '')}"
        if hasattr(pyd, "content"):
            content = pyd.content
            lines = content.split("\n")
            header = next((l.strip() for l in lines if l.strip() and not l.startswith("---")), "")
            return f"{header} ({len(content)} chars)"
        if hasattr(pyd, "display_name"):
            return f"{pyd.display_name}: {getattr(pyd, 'short_description', '')}"

    raw = getattr(task_output, "raw", None)
    if isinstance(raw, str):
        try:
            parsed = _json.loads(raw)
            if isinstance(parsed, dict) and "content" in parsed:
                content = parsed["content"]
                lines = content.replace("\\n", "\n").split("\n")
                header = next((l.strip() for l in lines if l.strip() and not l.startswith("---")), "")
                return f"{header} ({len(content)} chars)"
        except (_json.JSONDecodeError, TypeError):
            pass
        return raw[:300] + "…" if len(raw) > 300 else raw

    return str(task_output)[:300]


# ---------------------------------------------------------------------------
# Crew runner
# ---------------------------------------------------------------------------

class SkillCrewRunner:
    def __init__(self, model: str, verbose: bool = False) -> None:
        self.model = model
        self.verbose = verbose

    def run(self, request: GenerateSkillRequest) -> tuple[str, list[GeneratedFile]]:
        """Return (skill_name, files) assembled from per-file tasks."""
        from crewai import Agent, Crew, LLM, Process

        analysis_llm = LLM(model=self.model, temperature=0.2)
        writer_llm = LLM(model=self.model, temperature=0.3, max_tokens=16384)

        analyst = Agent(
            role="Creator Content Analyst",
            goal="Extract the repeatable workflow, constraints, audience, and tone from raw creator content.",
            backstory=(
                "You find structure in raw creator scripts and posts. "
                "You extract only what exists in the source — no invented additions. "
                "You quote the creator's exact words whenever possible."
            ),
            llm=analysis_llm,
            verbose=self.verbose,
        )

        writer = Agent(
            role="Skill File Author",
            goal=(
                "Write one detailed, production-ready skill file at a time, "
                "grounded entirely in the creator's actual content."
            ),
            backstory=(
                "You write skills as job descriptions, not prompts. "
                "You preserve the creator's exact method, phrases, vocabulary, and constraints. "
                "You never generate placeholder text — every file is complete, operational, and detailed. "
                "When asked for a reference file you write 80-150 lines of real content. "
                "You NEVER copy from reference examples — you use them for structure only."
            ),
            llm=writer_llm,
            verbose=self.verbose,
        )

        tasks = self._build_tasks(analyst, writer)

        crew = Crew(
            agents=[analyst, writer],
            tasks=tasks,
            process=Process.sequential,
            verbose=self.verbose,
        )

        result = crew.kickoff(inputs=request.model_dump())

        return self._extract_results(result, request)

    def run_with_events(
        self, request: GenerateSkillRequest, event_queue: Queue[dict[str, Any] | None],
    ) -> tuple[str, list[GeneratedFile]]:
        """Same as run() but pushes progress events to *event_queue*.

        Events are dicts like:
          {"type": "crew_start"}
          {"type": "task_start", "index": 0, "name": "Analyze", "agent": "..."}
          {"type": "step", "output": "..."}
          {"type": "task_done", "index": 0, "name": "Analyze", "summary": "..."}
          {"type": "crew_done"}
        A final None sentinel signals completion.
        """
        from crewai import Agent, Crew, LLM, Process, Task

        analysis_llm = LLM(model=self.model, temperature=0.2)
        writer_llm = LLM(model=self.model, temperature=0.3, max_tokens=16384)

        task_counter: dict[str, int] = {"current": -1}
        task_names = [
            "Analyze creator content",
            "Write SKILL.md",
            "Write framework.md",
            "Write examples.md",
            "Write sources.md",
            "Write openai.yaml",
        ]

        def on_step(step_output: Any) -> None:
            text = _extract_step_content(step_output)
            event_queue.put({
                "type": "step",
                "task_index": task_counter["current"],
                "output": text,
            })

        def on_task_done(task_output: Any) -> None:
            idx = task_counter["current"]
            raw = _extract_task_content(task_output)
            event_queue.put({
                "type": "task_done",
                "index": idx,
                "name": task_names[idx] if idx < len(task_names) else f"Task {idx}",
                "summary": raw,
            })
            task_counter["current"] = idx + 1
            if task_counter["current"] < len(task_names):
                event_queue.put({
                    "type": "task_start",
                    "index": task_counter["current"],
                    "name": task_names[task_counter["current"]],
                })

        analyst = Agent(
            role="Creator Content Analyst",
            goal="Extract the repeatable workflow, constraints, audience, and tone from raw creator content.",
            backstory=(
                "You find structure in raw creator scripts and posts. "
                "You extract only what exists in the source — no invented additions. "
                "You quote the creator's exact words whenever possible."
            ),
            llm=analysis_llm,
            verbose=self.verbose,
        )

        writer = Agent(
            role="Skill File Author",
            goal=(
                "Write one detailed, production-ready skill file at a time, "
                "grounded entirely in the creator's actual content."
            ),
            backstory=(
                "You write skills as job descriptions, not prompts. "
                "You preserve the creator's exact method, phrases, vocabulary, and constraints. "
                "You never generate placeholder text — every file is complete, operational, and detailed. "
                "When asked for a reference file you write 80-150 lines of real content. "
                "You NEVER copy from reference examples — you use them for structure only."
            ),
            llm=writer_llm,
            verbose=self.verbose,
        )

        tasks = self._build_tasks(analyst, writer)

        event_queue.put({"type": "crew_start", "total_tasks": len(tasks), "task_names": task_names})
        task_counter["current"] = 0
        event_queue.put({"type": "task_start", "index": 0, "name": task_names[0]})

        crew = Crew(
            agents=[analyst, writer],
            tasks=tasks,
            process=Process.sequential,
            verbose=self.verbose,
            step_callback=on_step,
            task_callback=on_task_done,
        )

        result = crew.kickoff(inputs=request.model_dump())
        event_queue.put({"type": "crew_done"})
        event_queue.put(None)

        return self._extract_results(result, request)

    def _build_tasks(self, analyst: Any, writer: Any) -> list:
        """Build the list of CrewAI tasks (shared between run and run_with_events)."""
        from crewai import Task

        creator_block = (
            "--- ORIGINAL CREATOR CONTENT (use this as your primary source) ---\n"
            "{creator_content}\n"
            "--- END CREATOR CONTENT ---\n"
        )

        analyze_task = Task(
            description=(
                "Analyze the creator content and extract a THOROUGH structured analysis.\n\n"
                "Content kind: {content_kind}\n"
                "Creator: {creator_name}\n"
                "Desired name: {desired_skill_name}\n"
                "Outcome: {target_outcome}\n"
                "Audience: {audience}\n\n"
                "--- CREATOR CONTENT ---\n"
                "{creator_content}\n"
                "--- END ---\n\n"
                "Extract ALL of the following:\n"
                "- skill_name: IMPORTANT — if 'Desired name' is provided above, USE THAT EXACT VALUE "
                "as the skill_name. If not provided, create a kebab-case name that includes the "
                "creator's name or handle (e.g. 'mkbhd-tweet-style', 'naval-thread-craft', "
                "'paul-graham-essay-voice'). NEVER use generic names like 'tech-content-creation' "
                "or 'twitter-thread-analysis' — the name must identify the specific creator.\n"
                "- display_name: human-readable title that includes the creator's name "
                "(e.g. 'MKBHD Tweet Style', not 'Tech Content Creation')\n"
                "- description: one sentence capturing the skill's purpose — must mention the "
                "creator by name and be specific about their style, not generic\n"
                "- primary_topic: the core subject the creator teaches\n"
                "- target_audience: who this skill is for\n"
                "- tone: describe HOW the creator writes (sentence style, personality, directness)\n"
                "- workflows: extract EVERY step the creator describes, as numbered items — "
                "be granular, include sub-steps if the creator mentions them\n"
                "- constraints: EVERY restriction, rule, or 'do not' the creator states — "
                "quote their exact words where possible\n"
                "- key_phrases: extract 10-20 exact phrases/sentences verbatim from the source "
                "that capture the creator's voice, method, and rules. Copy-paste, do not paraphrase.\n\n"
                "CONTENT-KIND-SPECIFIC ANALYSIS:\n"
                "If content_kind is 'twitter-threads', also extract:\n"
                "  - Tweet opening patterns (how do tweets start? question, statement, hot take, announcement?)\n"
                "  - Tweet structure patterns (length, use of threads, use of links, use of emojis)\n"
                "  - Engagement mechanics (how does the creator drive replies, retweets, clicks?)\n"
                "  - Recurring tweet formats (e.g. 'NEW VIDEO - ...', hot takes, comparisons, Q&A)\n"
                "  - Topics the creator tweets about most and how they frame them\n"
                "If content_kind is 'youtube-script', also extract:\n"
                "  - Video structure patterns (how do they open, transition, close?)\n"
                "  - Recurring segment types (reviews, comparisons, opinions, rankings)\n"
                "  - Speaking style (conversational, technical, storytelling?)\n"
                "  - How they make complex topics accessible\n\n"
                "IMPORTANT: Only extract what exists in the source. Do not invent or embellish."
            ),
            expected_output="A SkillAnalysis with all fields populated from the source, with key_phrases containing 10-20 verbatim quotes.",
            agent=analyst,
            output_pydantic=SkillAnalysis,
        )

        skill_md_task = Task(
            description=(
                "Write the root SKILL.md file for this skill package.\n\n"
                "STRUCTURAL EXAMPLE (varun-maya — for FORMAT reference only, do NOT copy content):\n"
                f"```\n{EXAMPLE_SKILL_MD}```\n"
                f"{GROUNDING_WARNING}"
                f"{creator_block}\n"
                "Content kind: {content_kind}\n\n"
                "REQUIREMENTS:\n"
                "- YAML frontmatter with `name` and `description` (one sentence).\n"
                "  IMPORTANT: If 'Desired name' is provided above, use that EXACT name in the "
                "frontmatter `name:` field. The name must identify the specific creator.\n"
                "- 2-3 sentence intro explaining what the skill does — mention the creator by "
                "name/handle and use their own language\n\n"
                "- 'Framework at a Glance' section: 4-6 bold-labeled items summarizing the creator's "
                "ACTUAL steps/patterns. CRITICAL: Do NOT use generic labels like 'Product Reviews', "
                "'Engagement', 'Content Sharing'. Instead, derive SPECIFIC pattern names from the "
                "creator's actual content. For example, if a tweet starts with 'NEW VIDEO -' that's "
                "a specific pattern named 'Launch Announce' or 'Video Drop', not generic 'Content Sharing'. "
                "Each item should have a 1-2 sentence description using the creator's own words.\n\n"
                "- 'Hard Constraints' section: list 5-8 of the creator's exact restrictions and style rules. "
                "These must be SPECIFIC and ACTIONABLE, not vague. Bad: 'Maintain a concise tone.' "
                "Good: 'Max 280 characters. No thread unless comparing 3+ products.' "
                "Quote the creator's actual language where possible. Include format constraints "
                "(length, structure), tone constraints (what to avoid), and content constraints.\n\n"
                "- 'Output Format' section: show the EXACT output structure appropriate for the "
                "content kind. IMPORTANT: Adapt this to the content kind:\n"
                "  * For twitter-threads: show tweet format (character count, thread structure, "
                "    link/emoji usage patterns observed in the source tweets)\n"
                "  * For youtube-script: show script format (intro structure, segment transitions, "
                "    estimated timing per section)\n"
                "  * For generic: show the output format implied by the creator's content\n"
                "  * Do NOT blindly copy 'Estimated duration: ~Xs' from the example — that only "
                "    applies to timed video scripts\n\n"
                "- 'References' section linking to `references/framework.md`, `references/examples.md`, "
                "and `references/sources.md`, each with a one-line description\n\n"
                "CONSTRAINTS:\n"
                "- Under 60 lines total — this is an INDEX, not the full method\n"
                "- All detailed logic goes in the reference files, not here\n"
                "- Use the creator's actual phrases, not generic social media advice\n"
                "- Do NOT use any language from the varun-maya example\n"
                "- The skill must feel like it was written BY someone who deeply studied this "
                "specific creator, not by a generic content strategy template"
            ),
            expected_output=(
                "A concise SKILL.md (under 60 lines) with frontmatter, "
                "framework overview using creator-specific pattern names and their own language, "
                "5-8 specific actionable constraints, "
                "output format adapted to the content kind (NOT a copy of the varun-maya format), "
                "and references."
            ),
            agent=writer,
            context=[analyze_task],
            output_pydantic=FileContent,
        )

        framework_task = Task(
            description=(
                "Write references/framework.md — the DETAILED operating framework for this skill.\n\n"
                "STRUCTURAL EXAMPLE (varun-maya — for FORMAT reference only, do NOT copy content):\n"
                f"```\n{EXAMPLE_FRAMEWORK}```\n"
                f"{GROUNDING_WARNING}"
                f"{creator_block}\n"
                "Content kind: {content_kind}\n\n"
                "IMPORTANT DISTINCTION — Patterns vs Workflow Steps:\n"
                "The 'Named Patterns' section must NOT just rename the workflow steps. "
                "Patterns describe DISTINCT TECHNIQUES or APPROACHES within the workflow. "
                "For example, if the creator says 'rewrite the opening so it lands in the first 2 seconds', "
                "the patterns might describe different TYPES of hook rewrites: question openers, "
                "bold claim openers, statistic openers, etc. Look for variety in HOW each step can be "
                "executed, not just WHAT the steps are.\n\n"
                "CONTENT-KIND-SPECIFIC GUIDANCE:\n"
                "If content_kind is 'twitter-threads':\n"
                "  - Named Patterns should be distinct TWEET FORMATS (e.g. 'Video Drop', 'Hot Take', "
                "'Price Commentary', 'Hands-On Teaser', 'Comparative Spec Shot')\n"
                "  - Execution steps should cover: crafting the opener, choosing format, adding context, "
                "including media/links, engagement hooks\n"
                "  - Constraints should include character limits, thread vs single tweet decisions, "
                "link placement, emoji usage, posting timing\n"
                "If content_kind is 'youtube-script':\n"
                "  - Named Patterns should be distinct VIDEO SEGMENT TYPES\n"
                "  - Execution steps should cover: intro hook, main content structure, transitions, outro\n"
                "  - Constraints should include timing, visual requirements, pacing\n\n"
                "YOUR FILE MUST INCLUDE ALL OF THESE SECTIONS:\n\n"
                "## Named Patterns (3-5 distinct techniques)\n"
                "- These are sub-techniques WITHIN the workflow, not the workflow steps themselves\n"
                "- Each pattern: a descriptive name, a template in > blockquotes showing how it works, "
                "and 2-3 sentences explaining when to use this pattern vs another\n"
                "- Derive patterns from how the creator describes their process — what variations "
                "or conditional approaches do they imply?\n\n"
                "## Step-by-Step Execution Sequence\n"
                "- Break every workflow step into 2-3 granular sub-steps\n"
                "- Each sub-step: a concrete action with specific criteria\n"
                "- Include the creator's quantities (e.g. '5 to 7', '30 to 45 seconds', 'first 2 seconds')\n"
                "- Add decision logic: when to pick one moment over another, how to judge quality\n\n"
                "## Constraints with Explanations\n"
                "- Every constraint the creator states, quoted VERBATIM from the source\n"
                "- For each: WHY the creator has this rule (infer from context)\n\n"
                "## Output Contract\n"
                "- Exact format for each of the 3 output types the creator specifies\n"
                "- Quality criteria: what makes a good vs bad version of each output\n"
                "- Length/timing requirements from the source\n\n"
                "## Language and Style Rules\n"
                "- The creator's actual sentence patterns and word choices from the source\n"
                "- Their communication style: commands, directness, tone\n"
                "- Extract these ONLY from the creator content, never from the varun-maya example\n\n"
                "CONSTRAINTS:\n"
                "- Must be at least 80 lines\n"
                "- Use markdown headers (##, ###) to organize\n"
                "- Include blockquotes (>) for pattern templates\n"
                "- Quote the creator's exact phrases when describing rules\n"
                "- SPREAD your quote selections across the ENTIRE source corpus — do not cluster "
                "around the same few quotes. Use different source material for each pattern.\n"
                "- Do NOT borrow patterns or language from the varun-maya example"
            ),
            expected_output="A detailed framework.md (80+ lines) with named sub-techniques, granular execution steps with the creator's specific numbers, constraints with explanations, output contract for all 3 output types, and language rules from the source.",
            agent=writer,
            context=[analyze_task],
            output_pydantic=FileContent,
        )

        examples_task = Task(
            description=(
                "Write references/examples.md — annotated EXAMPLES of this skill in action.\n\n"
                "STRUCTURAL EXAMPLE (varun-maya — for FORMAT reference only, do NOT copy content):\n"
                f"```\n{EXAMPLE_EXAMPLES}```\n"
                f"{GROUNDING_WARNING}"
                f"{creator_block}\n"
                "Content kind: {content_kind}\n\n"
                "CRITICAL: Read the creator content above carefully. Your examples must demonstrate "
                "THIS SPECIFIC SKILL being applied to THIS SPECIFIC DOMAIN.\n\n"
                "DIVERSITY RULE: You have access to the framework.md that was already written. "
                "Your examples MUST use DIFFERENT quotes and source material from what framework.md already used. "
                "Do not repeat the same 5-6 quotes — pull from parts of the source corpus that haven't been featured yet.\n\n"
                "CONTENT-KIND-SPECIFIC EXAMPLES:\n"
                "If content_kind is 'twitter-threads':\n"
                "- INPUT = a topic/product/event the creator would tweet about\n"
                "- OUTPUT = actual tweet(s) written in the creator's exact style, including their "
                "typical formatting (capitalization, emoji usage, link placement, thread structure)\n"
                "- Show DIFFERENT tweet formats the creator uses (announcement, hot take, review, etc.)\n"
                "If content_kind is 'youtube-script':\n"
                "- INPUT = a product/topic the creator would review\n"
                "- OUTPUT = script segments in the creator's voice and structure\n"
                "If content_kind is 'generic':\n"
                "- INPUT = source material matching what the creator works with\n"
                "- OUTPUT = the actual content the skill would produce\n\n"
                "YOUR FILE MUST INCLUDE:\n\n"
                "## 3+ Good Examples\n"
                "For each example:\n"
                "- **Input:** A brief summary of realistic source material that the skill would process "
                "(e.g. a video transcript, tweet thread, etc. matching what the creator works with)\n"
                "- **Output:** The COMPLETE output the skill produces — show EVERY output type "
                "the creator specifies. If the creator says 'produce 3 outputs', show all 3 "
                "with actual realistic content, not placeholders.\n"
                "- **Why it works:** Name the specific rules from the CREATOR'S method that this example follows. "
                "Use the CREATOR'S terminology (e.g. 'core promise', 'sharp moments', 'native hook', 'central claim'), "
                "NOT terminology from the varun-maya example (do NOT use 'Hook', 'Pivot', 'Body', 'CTA' as labels).\n"
                "- IMPORTANT: Do NOT invent statistics, studies, or fabricated data in the example outputs. "
                "The creator explicitly says: 'Do not invent stories, stats, or examples.'\n"
                "- Do NOT use varun-maya CTA patterns like 'Comment [WORD] and I'll DM you' or 'What do you think'. "
                "Instead, use whatever engagement style fits the creator's own voice.\n\n"
                "## 2+ Anti-Examples\n"
                "For each:\n"
                "- The bad output for the same domain\n"
                "- **Why it fails:** Quote the SPECIFIC constraint from the creator's content that it violates\n"
                "- Show realistic mistakes: using generic hooks, inventing facts, missing output types, "
                "bloated explanations, etc.\n\n"
                "## Flat vs Alive Table\n"
                "- 5+ rows contrasting generic/flat phrasing with phrasing that follows the creator's method\n"
                "- Both columns must be about the creator's ACTUAL domain, not random topics\n\n"
                "CONSTRAINTS:\n"
                "- Must be at least 80 lines\n"
                "- EVERY example scenario must be about the creator's actual domain/topic\n"
                "- Do NOT use examples about unrelated subjects (no AI chips, no editing software, "
                "no personal branding — unless that IS the creator's topic)\n"
                "- Do NOT invent statistics or cite fake studies\n"
                "- Outputs in examples must match the EXACT format the creator specifies"
            ),
            expected_output="A detailed examples.md (80+ lines) with 3+ domain-specific good examples showing all output types, 2+ anti-examples citing the creator's exact constraints, and a flat-vs-alive table in the creator's domain. Uses DIFFERENT quotes from framework.md.",
            agent=writer,
            context=[analyze_task, framework_task],
            output_pydantic=FileContent,
        )

        sources_task = Task(
            description=(
                "Write references/sources.md — source-grounded material extracted from the creator.\n\n"
                f"{creator_block}\n"
                "DIVERSITY RULE: You have access to framework.md and examples.md that were already written. "
                "Your sources.md MUST maximize coverage of the source corpus. Prioritize quotes and phrases "
                "that have NOT already been featured prominently in the other files. The goal is that across "
                "all reference files, the reader sees the FULL breadth of the creator's content, not the same "
                "handful of quotes repeated everywhere.\n\n"
                "YOUR FILE MUST INCLUDE ALL OF THESE SECTIONS:\n\n"
                "## Key Phrases\n"
                "- Extract 15-25 important phrases VERBATIM from the creator content above\n"
                "- COPY-PASTE exact wording — do not paraphrase, rewrite, or summarize\n"
                "- Each phrase must be in quotes and must appear word-for-word in the source\n"
                "- IMPORTANT: Spread your selections across the ENTIRE source corpus. Do not cluster "
                "around the first few items. Pull from early, middle, AND late source material.\n"
                "- Include: workflow instructions, constraints, descriptions, and distinctive phrasing\n\n"
                "## Creator Voice Characteristics\n"
                "- 6+ bullet points describing HOW the creator communicates\n"
                "- Cover: sentence length, tone, directness, use of commands, perspective, personality\n"
                "- Support each characteristic with a brief quote from the source as evidence\n\n"
                "## Banned Phrases and Patterns\n"
                "- IMPORTANT: This section lists phrases that GENERATED content should AVOID.\n"
                "- Do NOT list the creator's own quotes here — their actual words are POSITIVE examples, not banned content.\n"
                "- A phrase that appears in the creator's tweets/content must NEVER appear in this banned list.\n"
                "- Instead, list:\n"
                "  1. Generic, flat, or templated phrases that would sound off-brand for this creator "
                "(e.g. 'Check out my latest video!' if the creator never writes that way)\n"
                "  2. Filler phrases or clichés that clash with the creator's voice\n"
                "  3. Any patterns the creator explicitly warns against (only if they actually say what NOT to do)\n"
                "  4. Overly formal or stiff language if the creator is casual (or vice versa)\n"
                "  5. Vague or unspecific language if the creator is detail-oriented\n"
                "- 8+ items total\n"
                "- For each banned phrase, explain WHY it violates the creator's style\n\n"
                "## Evidence and Quotes\n"
                "- 5-10 complete sentences copied VERBATIM from the creator content\n"
                "- Choose sentences that best capture the creator's method and reasoning\n"
                "- IMPORTANT: These should be DIFFERENT quotes from the ones in Key Phrases above. "
                "Do not repeat the same quotes across sections — maximize coverage of the source material.\n"
                "- These must be exact copies from the source — do NOT invent or modify\n\n"
                "## Terminology Glossary\n"
                "- Every creator-specific or domain-specific term from the source\n"
                "- For each: the term and a definition based on how the creator uses it\n\n"
                "CONSTRAINTS:\n"
                "- Must be at least 60 lines\n"
                "- EVERY quote must appear verbatim in the creator content above — "
                "if you can't find it in the source, don't include it\n"
                "- Do NOT include phrases from the varun-maya examples or from other generated files\n"
                "- Do NOT generalize or paraphrase — exactness is the whole point of this file"
            ),
            expected_output="A detailed sources.md (60+ lines) with verbatim phrases from the source (different from ones already in framework.md and examples.md), voice characteristics with evidence, banned patterns (NOT the creator's own quotes), exact quotes, and glossary.",
            agent=writer,
            context=[analyze_task, framework_task, examples_task],
            output_pydantic=FileContent,
        )

        yaml_task = Task(
            description=(
                "Generate the agent metadata for agents/openai.yaml.\n\n"
                "- display_name: the skill's human-readable title\n"
                "- short_description: one sentence describing what the skill does\n"
                "- default_prompt: must include the skill as $skill-name "
                "(e.g. 'Use $my-skill to ...')\n\n"
                "Use the skill_name and description from the analysis."
            ),
            expected_output="An AgentMeta with display_name, short_description, and default_prompt.",
            agent=writer,
            context=[analyze_task],
            output_pydantic=AgentMeta,
        )

        return [analyze_task, skill_md_task, framework_task, examples_task, sources_task, yaml_task]

    # ------------------------------------------------------------------

    def _extract_results(
        self, result: object, request: GenerateSkillRequest
    ) -> tuple[str, list[GeneratedFile]]:
        task_outputs = getattr(result, "tasks_output", [])

        analysis: SkillAnalysis | None = None
        skill_md_content: str | None = None
        framework_content: str | None = None
        examples_content: str | None = None
        sources_content: str | None = None
        agent_meta: AgentMeta | None = None

        for task_output in task_outputs:
            pyd = getattr(task_output, "pydantic", None)
            if isinstance(pyd, SkillAnalysis):
                analysis = pyd
            elif isinstance(pyd, AgentMeta):
                agent_meta = pyd
            elif isinstance(pyd, FileContent):
                if skill_md_content is None:
                    skill_md_content = pyd.content
                elif framework_content is None:
                    framework_content = pyd.content
                elif examples_content is None:
                    examples_content = pyd.content
                elif sources_content is None:
                    sources_content = pyd.content

        # Fallback: try raw output if pydantic parsing missed any
        for idx, slot_name in [(1, "skill_md"), (2, "framework"), (3, "examples"), (4, "sources")]:
            if idx >= len(task_outputs):
                continue
            val = locals().get(f"{slot_name}_content")
            if val is not None:
                continue
            raw = self._raw_as_string(task_outputs[idx])
            if raw:
                if slot_name == "skill_md":
                    skill_md_content = raw
                elif slot_name == "framework":
                    framework_content = raw
                elif slot_name == "examples":
                    examples_content = raw
                elif slot_name == "sources":
                    sources_content = raw

        if request.desired_skill_name:
            skill_name = request.desired_skill_name
        elif analysis:
            skill_name = analysis.skill_name
        else:
            skill_name = "generated-skill"

        files: list[GeneratedFile] = []
        if skill_md_content:
            files.append(GeneratedFile(relative_path="SKILL.md", content=skill_md_content))
        if framework_content:
            files.append(GeneratedFile(relative_path="references/framework.md", content=framework_content))
        if examples_content:
            files.append(GeneratedFile(relative_path="references/examples.md", content=examples_content))
        if sources_content:
            files.append(GeneratedFile(relative_path="references/sources.md", content=sources_content))

        if agent_meta:
            yaml_content = (
                "interface:\n"
                f'  display_name: "{agent_meta.display_name}"\n'
                f'  short_description: "{agent_meta.short_description}"\n'
                f'  default_prompt: "{agent_meta.default_prompt}"\n'
            )
            files.append(GeneratedFile(relative_path="agents/openai.yaml", content=yaml_content))

        return skill_name, files

    @staticmethod
    def _raw_as_string(task_output: object) -> str | None:
        raw = getattr(task_output, "raw", None)
        if raw is None:
            return None
        if isinstance(raw, str):
            return raw
        content = getattr(raw, "content", None)
        if isinstance(content, str):
            return content
        return str(raw)
