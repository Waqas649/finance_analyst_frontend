# Finance Analyst — AI Market Report Frontend

A conversational frontend for an AI-powered financial market report generation system. Built with Next.js 15.

---

## What it does

Type a natural language prompt and the multiagent AI pipeline runs in real time — collecting data, researching relevant events, drafting the report, and self-critiquing it — all streamed live to the UI step by step.

General questions and greetings are handled conversationally as well.

---

## Features

- **Chat interface** — thread sidebar, message history, optimistic UI updates
- **Live streaming** — each pipeline stage streams progress to the UI as it runs
- **Session resumption** — threads are checkpointed; continuing a conversation resumes from the last saved state
- **Data tiles** — key metrics rendered as compact cards on each final response
- **Collapsible sidebar** — thread history grouped by date, with per-thread delete and clear-all
- **Minimal design** — grayscale color system, Inter font

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Font | Inter |
| Markdown | react-markdown + remark-gfm |
| State | React useState / localStorage |
| Transport | Server-Sent Events (SSE) |
| Backend | FastAPI + LangGraph |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start the backend

Start the backend server on port `8000` (refer to the backend repo for setup instructions).

### 4. Run the frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API

The frontend connects to a single streaming endpoint.
A natural language prompt is sent and the response is streamed back as Server-Sent Events.

The stream emits incremental events as each stage completes, allowing the UI to show live progress rather than waiting for the full result.

| Event | Description |
|---|---|
| `resolved` | Confirmation that the request was understood and processing has started |
| `step` | Progress update fired as each stage of the pipeline completes |
| `complete` | Final event — the finished response is delivered here |
| `error` | Emitted if processing fails at any stage |

---

## Project Structure

```
app/
  page.tsx              Main chat interface
  layout.tsx            Root layout
  globals.css           Design system + Tailwind theme
  templates/page.tsx    Few-shot template manager

components/
  Sidebar.tsx           Collapsible thread sidebar
  ChatInput.tsx         Auto-resizing input with send button
  MessageBubble.tsx     Message renderer with market tiles + report

lib/
  api.ts                SSE streaming + template API calls
  threads.ts            Thread/Message types + localStorage helpers
```

---

## License

MIT

---

Built by [Waqas](https://www.linkedin.com/in/waqas495)
