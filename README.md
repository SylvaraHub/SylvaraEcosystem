<p align="center">
  <img width="400" height="400" alt="sylvara_ai_cover" src="https://github.com/SylvaraHub/SylvaraEcosystem/blob/main/sylvara_1-removebg-preview.png" />
</p>

<h1 align="center">Sylvara AI</h1>

<div align="center">
  <p><strong>AI-native workspace for stream analytics, creator agents, and content automation</strong></p>
  <p>
    Stream intelligence • AI planning • Post-stream review • Content repurposing • Cross-surface workflow
  </p>
</div>

<div align="center">

[![Web App](https://img.shields.io/badge/Web%20App-Open-3b82f6?style=for-the-badge&logo=googlechrome&logoColor=white)](https://your-web-app-link)
[![Telegram Mini App](https://img.shields.io/badge/Telegram%20Mini%20App-Launch-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/your_mini_app)
[![Docs](https://img.shields.io/badge/Docs-Read-8b5cf6?style=for-the-badge&logo=readthedocs&logoColor=white)](https://your-docs-link)
[![X.com](https://img.shields.io/badge/X.com-Follow-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/your_account)
[![Telegram Community](https://img.shields.io/badge/Telegram%20Community-Join-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/your_group_or_channel)

</div>

---

## Turn every stream into a repeatable growth loop

Sylvara AI helps creators and teams plan better streams, analyze what actually worked, and turn raw performance into concrete next actions

Instead of jumping from one stream to the next on intuition alone, Sylvara gives you one workspace for metrics, AI agents, automations, and cross-platform execution

> [!IMPORTANT]
> Sylvara AI is built around one shared workspace across the Web App, Telegram Mini App, browser extension, and API, so your streams, agents, settings, and credits stay aligned everywhere

## Demo First

Here is the core product loop in one view

```text
Idea or finished stream
        ↓
Sylvara AI ingests stream context + metrics
        ↓
Agents generate outline, review, or repurposing suggestions
        ↓
You receive structured next steps across web, Telegram, extension, or API
```

### Before → After

| Before Sylvara | With Sylvara |
|---|---|
| You guess which topics or formats worked | You review retention, engagement, and metadata in one place |
| You write prompts from scratch every time | You reuse purpose-built planning, analysis, and ideation agents |
| You lose context between tools | You keep one shared workspace across all product surfaces |
| You manually follow up after each stream | You automate analysis, summaries, alerts, and workflows |

> [!TIP]
> The fastest way to understand Sylvara is simple: connect your workspace, review a recent stream, run a post-stream analysis, and use the result to shape the next session

## Try in 30 Seconds

```bash
curl -X POST https://api.sylvara.app/v1/agents/run \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "stream-planner-v1",
    "workspace_id": "ws_123",
    "input": {
      "topic": "Weekly Q&A for creators",
      "target_platform": "youtube",
      "expected_duration_minutes": 90
    },
    "options": {
      "mode": "sync",
      "max_tokens": 1024
    }
  }'
```

Expected response shape

```json
{
  "agent_id": "stream-planner-v1",
  "mode": "sync",
  "stream_outline": {
    "title": "Weekly Creator Q&A",
    "segments": [
      {
        "label": "Intro and framing",
        "duration_minutes": 10
      },
      {
        "label": "Main discussion",
        "duration_minutes": 45
      }
    ]
  }
}
```

## What You’ll See

When you use Sylvara AI, the output is not vague AI text with no operational value

You get visible, usable artifacts such as structured stream outlines, segment timing, retention-backed post-stream summaries, highlight candidates, repurposing angles, and workspace-level history for every run

| Output | What it gives you |
|---|---|
| Stream outline | Segments, timing, and talking points for the next session |
| Post-stream analysis | Strong segments, weak points, and recommended changes |
| Repurposing suggestions | Clip candidates, titles, and angles for other platforms |
| Workspace history | A reusable record of past agent runs and decisions |

> [!NOTE]
> Sylvara is designed for repeated iteration, not one-off prompting. Each run becomes part of a larger workflow you can compare, refine, and automate over time

## Why People Pick It

| Advantage | Why it matters |
|---|---|
| ⚡ Speed | Run focused planning or review flows without rebuilding prompts or moving between disconnected tools |
| 🧩 Simplicity | Keep streams, agents, analytics, credits, and automations inside one system |
| 🎯 Output quality | Ground suggestions in real stream metrics, retention patterns, engagement signals, and content context |

## Core Product Surfaces

| Surface | Best used for |
|---|---|
| Web App | Deep analytics review, agent configuration, workspace management, plans and credits |
| Telegram Mini App | Quick summaries, on-the-go prompts, short analysis chats, notifications |
| Browser Extension | Inline actions on pages, quick saves, fast analysis while browsing |
| API | Programmatic access to streams, analytics, agents, jobs, and webhooks |

> [!WARNING]
> AI-powered actions consume credits. Heavier workflows such as full post-stream analysis typically cost more than short generation tasks

## Use Cases

### Plan streams with context instead of guessing

Turn a topic into a clear outline with segments, talking points, timing, and platform-aware structure using past performance as context

### Review completed streams with retention-backed insight

See where viewers stayed, where they dropped, and what should be repeated, shortened, moved earlier, or removed next time

### Repurpose content into clips and follow-up ideas

Detect strong moments, generate new titles and angles, and build a repeatable content loop from the same source stream

## Examples

### 1. Generate a stream outline

```json
{
  "agent_id": "stream-planner-v1",
  "workspace_id": "ws_123",
  "input": {
    "topic": "Creator workflow breakdown",
    "target_platform": "twitch",
    "expected_duration_minutes": 75,
    "recent_stream_ids": ["str_101", "str_102"]
  },
  "options": {
    "mode": "sync"
  }
}
```

### 2. Run a post-stream analysis job

```json
{
  "agent_id": "post-stream-analyst-v1",
  "workspace_id": "ws_123",
  "input": {
    "stream_id": "str_789",
    "include_metrics": true,
    "include_recommendations": true
  },
  "options": {
    "mode": "async"
  }
}
```

### 3. Fetch stream analytics directly

```http
GET /v1/analytics/streams/str_789?include=retention,engagement
Authorization: Bearer YOUR_API_KEY
```

## Workspace Logic

Sylvara AI uses one shared workspace across every surface, which means there is no split between your dashboard, your Telegram actions, your extension usage, and your API flows

```text
Web App ─┐
Telegram ├── Shared Workspace ── Agents ── Analytics ── Automations ── Credits
Extension┤
API ─────┘
```

This is what makes it possible to trigger an analysis from the extension, read the result in Telegram, and review the full history in the web app without losing context

## Plans, Credits, and $SYLVA

| Layer | Role inside Sylvara |
|---|---|
| Plans | Define baseline access, included credits, and feature availability |
| Credits | Power AI-driven actions such as analyses, agent runs, and automations |
| $SYLVA | Utility token used to top up credits and unlock higher-tier access or perks |

> [!CAUTION]
> $SYLVA usage is tied to real platform consumption. Before enabling token-based top-ups or advanced features, review current balance, limits, and workspace configuration

## Event-Driven Automation

Sylvara can react to workspace activity instead of waiting for manual follow-up every time

Typical workflow

```text
Stream ended
   ↓
Run post-stream analysis
   ↓
Send summary
   ↓
Create follow-up task
   ↓
Prepare next stream iteration
```

This lets creators and teams build a consistent operating rhythm around content instead of handling everything by hand after each session

## API Snapshot

The API follows standard HTTPS + JSON patterns and is organized around streams, analytics, agents, jobs, and webhooks

| Area | Example |
|---|---|
| Base path | `/v1/` |
| Auth | `Authorization: Bearer YOUR_API_KEY` |
| Common resources | `streams`, `analytics`, `agents`, `jobs`, `webhooks` |
| Async result flow | Run agent → receive `job_id` → fetch result or listen via webhook |

Minimal example

```http
POST /v1/agents/run
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

## Security and Data Principles

Sylvara approaches security and privacy as a core product layer, not as a side note

| Principle | Summary |
|---|---|
| Least privilege | Services and features use only the permissions required for their tasks |
| Encrypted transport | External and internal communication uses secure channels |
| Workspace isolation | Data is logically separated between workspaces |
| Sensitive data handling | Secrets are stored in hardened form and not exposed in client-side flows |
| No wallet secret storage | Seed phrases and private keys are not requested or stored |
| Backups and monitoring | Core systems are backed up and monitored for availability and integrity |

## Go Deeper

- **Docs** — architecture, workflows, product behavior, and implementation details
- **API** — endpoints for agents, analytics, jobs, and webhooks
- **Advanced usage** — automations, event-driven workflows, cross-surface operations, and integrations

---

## Who Sylvara AI Is For

Sylvara AI is built for creators and teams who want a more systematic content workflow

It fits individual streamers, recurring show formats, small studios, and growth-oriented operators who already care about metrics but want clearer decisions, faster iteration, and stronger reuse of what works

---

## Final Note

Sylvara AI does not replace creative judgment

It gives creators a structured system for turning stream data, AI agents, and automation into practical next steps they can actually use
