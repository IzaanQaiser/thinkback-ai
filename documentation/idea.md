
# 💡 Thinkback.ai — Idea Document

## 📌 Table of Contents
1. Problem Statement
2. Pain Point Deep Dive
3. Target Users
4. What It Does
5. Value & Differentiation
6. Value Proposition
7. User Personas
8. Feature Breakdown
9. Real-World Usage Scenarios
10. Core Workflows ⭐️
11. Competitor Landscape
12. MVP Scope (Hackathon)
13. Supported Input Methods
14. Privacy & Trust
15. Future Opportunities
16. 10-Sentence Summary

## 1. 🧠 Problem Statement
We’re flooded with content daily — life advice, motivation, how-tos — but most of it slips past us. You might scroll past something that could change your life, but it disappears under the noise of “Reddit storytime + Subway Surfers” videos. There’s no intelligent way to store, recall, and emotionally reconnect with valuable information you consumed earlier.

## 2. 💥 Pain Point Deep Dive
Most people:
- Save content… and never see it again.
- Don’t know what to search for later.
- Forget content even exists when they actually need it.

Quotes that reflect this pain:
- “I saved it… but where is it?”
- “I forgot I even had that video.”
- “I don’t know what to search for, I just feel overwhelmed.”
- “I waste 30 minutes trying to find that one TikTok.”
- “When I need advice, I can’t think of anything I saved before.”

## 3. 🎯 Target Users
Anyone who consumes valuable content online:
- **Students** — study tips, life advice, motivational content
- **Professionals** — productivity, finance, wellness
- **Content Creators** — idea inspiration, references
- **Self-Improvement Junkies** — psychology, fitness, focus
- **General Users** — anything meaningful, from TikToks to tweets

## 4. 🛠 What It Does
**Thinkback.ai** is your AI-powered content memory system. It helps you:
- **Save content** (YouTube, TikTok, Reddit, etc.)
- **Auto-organize** it using AI (topic, emotion, context)
- **Retrieve it** intelligently based on:
  - Direct description (“I saved a video about X…”)
  - Emotional state (“I feel Y, help me…”)
  - External context (“The market crashed — what did I save on investing?”)
- **Reflect** on your mood via journaling and get personalized content surfaced back to you

## 5. 🚀 Value & Differentiation
- **Standard saves = static.**
- **Thinkback saves = emotional, dynamic, and context-aware.**

Instead of scrolling through folders and bookmarks:
- AI **finds what you forgot**.
- AI **recommends what you need**, based on emotion and global events.
- AI **learns your patterns** and builds a retrieval system around *you*.

## 6. 🔑 Value Proposition
**Thinkback.ai is your personal AI-powered memory assistant** — helping you **save**, **organize**, and **retrieve** the most important content you’ve ever consumed *right when you need it most.*

## 7. 👤 User Personas
**🎓 Ali — The Overwhelmed Student (21 y/o)**
> Needs help retrieving study & motivation content during finals.

**💼 Sarah — The Burnt-Out Professional (29 y/o)**
> Wants emotional support from past content during low-energy periods.

**📱 Ayaan — The Idea Collector (17 y/o)**
> Wants to organize a chaotic flood of life-hack and startup content.

## 8. features-list

### auth
- [ ] Sign up and login with **email/password** - **v0.1**
- [ ] Sign in with **Google**
- [ ] Sign in with **GitHub**
- [ ] Sign in with **Apple**
- [ ] Sign in with **TikTok**
- [ ] Sign in with **Facebook**
- [ ] Store and track **auth provider info** (e.g., Google UID, provider ID)
- [ ] Manage **session persistence** (local vs session)
- [ ] Auto-refresh and maintain session with Firebase Auth
- [ ] Handle **sign-out** - **v0.1**
- [ ] Handle **password reset** (for email/password logins)
- [ ] Protect all user interactions behind **auth state guard** in frontend - **v0.1**
- [ ] Redirect unauthenticated users to login page - **v0.1**
- [ ] Store `uid` securely client-side for scoped database access - **v0.1**
- [ ] Integrate with Firestore Security Rules to validate logged-in identity - **v0.1**

### access
- [ ] Each user has their own Firestore document: `users/{uid}` - **v0.1**
- [ ] Store content in user-specific subcollections: `users/{uid}/savedContent` - **v0.1**
- [ ] Store journal entries under: `users/{uid}/journals`
- [ ] Apply **Firestore Security Rules** to restrict access: - **v0.1**
  - [ ] Users can only `read/write` their own `users/{uid}` document - **v0.1**
  - [ ] Users can only access `savedContent` and `journals` where `uid == request.auth.uid` - **v0.1**
- [ ] Ensure Cloud Storage access is scoped via Firebase rules (only upload to own bucket folders) - **v0.1**
- [ ] Design backend endpoints (if any) to require and validate `uid` from Firebase JWT
- [ ] Prevent any backend agent/API access to data from other users
- [ ] Log access attempts and errors for audit/debugging
- [ ] Set up automatic cleanup of a user’s data upon account deletion
- [ ] Prevent duplicate entries from being saved across user boundaries (no global deduplication leakage)

### content-saving
- [ ] Paste URL from supported platforms (YouTube, TikTok, Reddit, Instagram, Twitter/X) - **v0.1**
- [ ] Auto-fetch metadata (title, platform, timestamp, etc.) - **v0.1**
- [ ] Paste or write plain text (e.g., notes, ideas, quotes) - **v0.1**
- [ ] Upload files (video, audio, image, PDF)
- [ ] Add optional personal annotations (notes, tags, reflections)

### content-classification
- [ ] Store metadata (platform, link, title, timestamp, duration, transcript) - **v0.1**
- [ ] Assign main category (e.g., Finance, Wellness, Motivation, Academic) - **v0.1**
- [ ] Extract sub-topics (e.g., "David Goggins", "deep work", "crypto")
- [ ] Detect emotional tone (e.g., “hopeful”, “urgent”, “relaxed”)
- [ ] Automatically tag journal entries with emotion + themes
- [ ] Flag duplicate or near-duplicate entries

### content-storage
- [ ] Save raw user input (URL, text, upload) to Firestore or Cloud Storage (depending on type) - **v0.1**
- [ ] Store structured metadata (title, tags, category, platform, notes) in Firestore - **v0.1**
- [ ] Ensure all content entries have creation, last-accessed, and resurfaced timestamps - **v0.1**
- [ ] Delete user content (remove from Firestore, Vector DB, and Cloud Storage if applicable)
- [ ] Enable access control (per-user content isolation via UID) - **v0.1**
- [ ] Store journaling entries (raw + parsed) with timestamp and user ID
- [ ] Link Firestore metadata with vector database entry ID for unified lookup
- [ ] Connect saved content with associated journal entries via Firestore references
- [ ] Store transcripts and annotations linked to parent content entries
- [ ] Store emotional profile per entry (for mood-aware retrieval)
- [ ] Handle large file uploads (videos, PDFs) via Cloud Storage and store references in Firestore
- [ ] Automatically archive unused or old entries for future passive resurfacing
- [ ] Ensure versioning or change tracking for edited content (user notes, tags, etc.)
- [ ] Allow user to delete saved entries from dashboard - **v0.1**
- [ ] Update `lastAccessedAt` timestamp when user opens content - **v0.1**
- [ ] file/data schema - **v0.1**


### content-embedding-and-indexing
- [ ] Generate semantic embedding of content using Gemini or similar
- [ ] Store embeddings in a Vector DB (e.g., Pinecone, Weaviate)
- [ ] Store metadata + structured data in Firestore - **v0.1**
- [ ] Link vector entries with Firestore documents
- [ ] Timestamp each entry (save time, accessed time, resurfaced time) - **v0.1**

### direct-content-retrieval
- [ ] User describes the content they want
- [ ] Conversational Agent parses and classifies input
- [ ] Search Agent embeds query and matches in Vector DB
- [ ] Return most relevant match with preview, notes, and metadata

### conversational-content-retrieval
- [ ] User types natural query into chat (e.g., “Find that video on sleeping better”)
- [ ] Conversational Agent detects content search intent
- [ ] Query is semantically embedded using Gemini
- [ ] Search Agent queries Vector DB
- [ ] Firestore enriches result with metadata
- [ ] Conversational Agent replies naturally with preview + actions
- [ ] Agent detects ambiguous input and asks clarifying question
- [ ] NLP Agent parses emotional tone of message
- [ ] NLP Agent synthesizes counter-emotion
- [ ] Build refined semantic vector with emotion + time context
- [ ] Retrieve emotionally relevant past content
- [ ] AI returns reflection or micro-action plan
- [ ] Agent checks journals for recurring emotional patterns
- [ ] Suggests content helpful in similar states
- [ ] Reflects back patterns to user conversationally
- [ ] Injects global context signals (exam week, market crash, etc.)
- [ ] Combines all layers into intelligent, personalized suggestions
- [ ] User can rate response for feedback loop
- [ ] Chat with AI for content retrieval
- [ ] Get AI-generated reflections, journaling prompts, and support
- [ ] Inline previews of relevant content
- [ ] Embedded buttons: Watch Now, Reflect, Resurface Similar

### global-context-retrieval
- [ ] Detect global/local events (e.g., market crash, exam season)
- [ ] Pull real-world context from APIs or local time-based rules
- [ ] Inject context into ongoing queries
- [ ] Proactively recommend content based on world situation

### reflective-content-retrieval
- [ ] User writes or records a journal entry
- [ ] NLP Agent parses journal sentiment, themes, pain points
- [ ] Journal is embedded and stored in Vector DB
- [ ] AI fetches relevant saved content that matches emotional tone
- [ ] AI delivers reflection or coping/action guidance

### dashboard
- [ ] Filter content by platform, date, tag, emotion, type - **v0.1**
- [ ] Keyword + semantic search via search bar
- [ ] Manually reclassify, edit, delete, archive entries
- [ ] Resurface content directly from dashboard filters
- [ ] Display chronological feed of saved content - **v0.1**
- [ ] Group entries by date, tag, platform, or emotion
- [ ] Show thumbnail, title, platform icon, summary - **v0.1**
- [ ] Inline actions: Open, Reflect, Edit Tags, Delete, Send to AI

### passive-resurfacing
- [ ] Resurface content based on elapsed time (e.g., “Saved 30 days ago”)
- [ ] Resurface based on usage or emotional pattern (e.g., “anxious Mondays”)
- [ ] Trigger content resurfacing based on current mood or time

### smart-feed-suggestions
- [ ] Display context-aware dashboard suggestions
- [ ] Use historical emotional patterns to recommend content (e.g., “You usually revisit this on Sundays...”)
- [ ] Trigger nudges based on journaling history or AI-inferred emotional trends

### journaling-features
- [ ] Write journal entries using rich text editor
- [ ] Record voice logs (with automatic transcription)
- [ ] NLP parses tone and themes of journal
- [ ] AI generates reflection prompts or small action plans
- [ ] Link journal entries to saved content
- [ ] Show timeline view of journal history with tone badges
- [ ] Archive, tag, or delete journal logs
- [ ] View timeline of journal entries
- [ ] Add new entries (text or voice)
- [ ] View AI feedback, reflections, and linked content

### agent-systems
- [ ] Classification Agent — Categorizes content during ingestion - **v0.1**
- [ ] Conversational Agent — Main chat interface, input router, response generator
- [ ] Search Agent — Matches semantic queries with saved content in Vector DB
- [ ] NLP Agent — Emotion analysis, journal parsing, mood detection, theme abstraction
- [ ] Global Context Agent — Maps real-world triggers (e.g. news, calendar events) to relevance
- [ ] Agent chaining workflows (e.g. journal → NLP → Search → Conversational)

### backend-and-system-tooling
- [ ] Firestore — Metadata, journal storage, user data
- [ ] Vector DB — Embedding and semantic similarity search
- [ ] Gemini API — Summarization, tone detection, conversation modeling, embedding
- [ ] FastAPI — Agent orchestration, auth, query routing, REST endpoints
- [ ] Cloud Run — Container deployment for backend services
- [ ] Firebase Auth — User authentication + session handling
- [ ] Postman / cURL — API testing and validation
- [ ] Unit Testing Suite — Agent logic, API routes, backend validation


## 9. 🌍 real-world usage scenarios

### 📌 1. Direct Retrieval
> “Find me that David Goggins podcast I saved last month.”<br>
Semantic + keyword search returns exact match.

### 🧠 2. Emotional Search / Support
> “I feel stuck and burnt out.”<br>
Emotion parsed, uplifting saved media + plan surfaced.

### 🌐 3. Global Context Suggestion
> “Hey, it’s exam season — here’s what you saved before midterms last year.”<br>
Automatically pulls relevant motivational study content.

### 💡 4. Passive Resurfacing (Memory Nudges)
> “30 days ago you saved this… want to revisit it?”<br>
AI re-surfaces based on time, emotion, and usage patterns.

### 📓 5. Emotionally-Aware Journaling Feedback
> “I’m drained. Life feels repetitive.”<br>
Thinkback returns saved content + reflection:<br>
“You’ve written this 3x before. Here’s a clip you found helpful last time.”

### 🔁 6. Reflective Habit Loop
Thinkback detects journaling about anxiety every Monday morning.
Suggests saved relaxing content each Sunday night as a preemptive nudge.

### 📂 7. Manual Browsing
User opens dashboard, filters by “Productivity” tag + “Sad” emotion.
Finds relevant videos, reflections, and past journal connections.


## 10. 🧠 Core Workflows

Thinkback.ai is powered by a modular system of AI agents, Firestore for structured data, and a vector database (like Pinecone or Weaviate) for deep semantic search. All user interactions — from saving content to emotional retrieval — revolve around a central dashboard interface that functions as the user’s content brain. <br>

1. Saving Content

Purpose: Users save meaningful content into their Thinkback memory system. <br>

Workflow:
- User submits a link (e.g., YouTube, TikTok, Reddit) or uploads media via the dashboard.
- Collection Agent fetches metadata (title, platform, date) and, if possible, transcripts.
- Classification Agent:
- Assigns a main tag (e.g. “motivation”, “finance”).
- Adds secondary tags (e.g. “Goggins”, “stocks”).
- Extracts emotional tone using NLP.
- Saves raw + structured data to Firestore (core DB).
- Embeds semantic vectors and stores them in the vector DB.
- Entry appears instantly in the user’s dashboard.

Tools Used:
- Collection Agent
- Classification Agent
- NLP Agent
- Firestore
- Vector DB
- Gemini
- Dashboard UI

<br>
<br>

2. Direct Retrieval (Search by Description)

Purpose: User knows what they saved and wants to find it quickly.

Workflow:
- User types into the chat: “Find that video I saved on building a bridge in Minecraft.”
- Conversational Agent parses the query and tags it as a direct retrieval.
- Search Agent sends the user’s query as an embedding to the vector DB.
- Vector DB returns top-k similar saved entries based on semantic match.
- Firestore is queried for structured metadata (timestamp, platform, title, etc.).
- Conversational Agent returns a result + context (“Here’s your Minecraft tutorial.”).

Tools Used:
- Conversational Agent
- Search Agent
- Vector DB
- Firestore
- Gemini
- Dashboard (chat window + preview pane)

<br>
<br>

3. Emotional Retrieval (Search by Feeling or Mood)

Purpose: User doesn’t know exactly what to search for — only how they feel.

Workflow:
- User types in chat: “I feel super stuck and unmotivated.”
- NLP Agent detects emotion: frustrated, unfocused, sad
- NLP Agent generates a counter-emotion vector: focused, confident, hopeful
- Conversational Agent collaborates with Global Context Agent to understand current world context (e.g., Monday morning, gloomy weather, midterms).
- Combined emotional + situational vector is sent to Search Agent.
- Search Agent queries vector DB to find best-matching saved content.
- Top result(s) returned with a reflective message and small plan (e.g. “You saved this during your last slump — try rewatching it and going for a walk.”)

Tools Used:
- Conversational Agent, NLP Agent
- Global Contex
- Agent
- Search Agent
- Vector DB
- Firestore
- Dashboard (chat + playback window)

<br>
<br>

4. Global-Context Suggestions

Purpose: Proactively surface content based on real-world events or user’s environment.

Workflow:
- Global Context Agent scrapes or listens to:
- News APIs, stock market, world events
- Time of day, seasonality, and user location
- It identifies a “trigger” (e.g., exam week, market crash, Ramadan).
- That trigger is converted into a vector and passed to Search Agent.
- Search Agent surfaces matching past saved entries from vector DB.
- Results appear in the dashboard’s “Suggested for You” or are pushed in chat.

Tools Used:
- Global Context Agent
- Search Agent
- Vector DB
- Dashboard (smart feed component)

<br>
<br>

5. Journaling & Reflective Feedback

Purpose: Users record their thoughts — Thinkback responds like a journal therapist.

Workflow:
- User writes or voice-records a journal entry via the dashboard.
- NLP Agent parses tone and themes (e.g., “burnout”, “anxiety”, “purpose”).
- Embeds journal content into the vector DB to link it with saved content.
- Emotional vector is used to fetch aligned or uplifting content from vector DB.
- Search Agent compiles content + NLP Agent adds a personalized reflection.
- Conversational Agent responds like a coach or friend in chat.

Tools Used:
- NLP Agent
- Search Agent
- Vector DB
- Conversational Agent
- Dashboard (journal tab + chat interface)

<br>
<br>

6. Passive Resurfacing (Memory Nudges)

Purpose: AI resurfaces forgotten content just when it’s most needed — no prompt required.

Workflow:
- System tracks:
- When you saved an item
- Your past emotional states
- Your journaling history
- Based on time (e.g., 30 days later) or pattern (e.g., recurring slump), it triggers resurfacing.
- Search Agent selects relevant past content based on stored vectors.
- Content appears in “From Your Vault” section of the dashboard, or as a proactive chat message.

Tools Used:
- Search Agent
- Vector DB
- Dashboard (feed + proactive notifications)
- Conversational Agent

<br>
<br>

7. Dashboard Browsing (Manual Control)

Purpose: Give users full manual access to their saved content archive.

Workflow:
- User opens dashboard and sees content grouped by:
- Tag (motivational, educational)
- Emotion (hopeful, stressed)
- Platform (YouTube, TikTok, Reddit)
- Date saved
- Click on any entry to see:
- Summary, original link, AI tags, emotion
- Editable user notes
- Option to “Re-tag” or “Reflect on this”
- Search bar uses vector DB + keyword fallback to allow natural search.

Tools Used:
- Frontend UI
- Firestore
- Vector DB
- NLP Agent (for search bar enhancements)
- Search Agent

<br>
<br>

🔁 Summary of System Roles by Agent/Tool

Component	Role
Dashboard	Central interface for all workflows (saving, retrieving, journaling, browsing, reflecting).
Conversational Agent	Handles user interaction, understands query type, and delivers results.
Classification Agent	Tags and organizes all incoming saved media.
Search Agent	Receives context and queries the vector DB for most relevant saved items.
NLP Agent	Detects emotional tone, generates counter-emotions, processes journals.
Global Context Agent	Adds real-world awareness (news, time, global/local events).
Firestore	Stores structured metadata (title, tags, notes, user ID, timestamps).
Vector DB	Enables AI-powered semantic search by embedding all content and context.
Gemini API	Handles complex language understanding, summarization, and chat completions.


## 11. 🧪 Competitor Landscape
Product -> Why Thinkback is Better
Pocket -> No emotion, no AI, no smart retrieval
Notion -> Manual, effort-heavy, static
Mem -> Tags memories but no emotional search
Rewind.ai -> Too much data, no emotional feedback
Bookmarks -> Forgotten, poorly organized

## 12. 🧪 MVP Scope (Hackathon)
✅ Includes:
- Link-based saving + notes
- Auto-tagging via AI
- Retrieval via direct/emotional/global query
- Dashboard with stored content
- Journaling & reflection loop
- Web app

🚫 Not in MVP:
- Browser/mobile integrations
- Notifications or push
- Shared collections
- Wrapped reports
- Advanced habit learning (beyond journaling)

## 13. ⌨ Supported Input Methods
- Link pasting
- Manual upload
- Share-to app (future)
- Screenshot parsing (future)

## 14. 🔐 Privacy & Trust
- Full user control over saved data
- Download/export options
- No emotional data ever sold
- On-device learning in future versions

## 15. 🔮 Future Opportunities
- Browser extension & mobile app
- Social layer (share collections or “emotional kits”)
- Push notifications
- Coaching mode with 7-day plans
- Habit analytics
- “Spotify Wrapped” style content recaps

## 16. 🧠 10-Sentence Summary
Thinkback.ai is an AI-powered memory system for meaningful content. It helps users save and emotionally reconnect with valuable internet content when they need it most. Instead of letting content get lost in bookmarks or saved folders, Thinkback uses five AI agents to tag, organize, and intelligently retrieve it. Users can speak naturally — describing a video or how they feel — and the system finds the perfect match. It also suggests forgotten content based on global news or emotional patterns. Emotional journaling triggers personalized content feedback. A modular agent-based architecture powers the system with classification, NLP, search, global awareness, and conversational flow. The MVP supports saving links, categorizing them, and retrieving them via natural conversation. The future vision includes social sharing, habit loops, and personalized growth plans. Thinkback.ai turns passive saving into active self-guidance and emotional intelligence.
