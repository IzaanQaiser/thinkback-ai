
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

## 8. 🧩 feature-breakdown

### Content Ingestion (Saving)

- **Link Pasting**: User pastes a URL (YouTube, TikTok, Reddit, Instagram, Twitter/X) into the dashboard.
- **File Uploads**: User can upload a video, audio file, image, or PDF.
- **Text Capture**: User can paste copied text or write original notes.
- **Optional Annotations**: Users may optionally add personal notes, tags, or reflections at time of saving.

### AI Auto-Classification
- Assigns a **main category** (e.g. Motivation, Finance, Academic, Wellness, Inspiration).
- Extracts **sub-topics** (e.g. “stocks”, “David Goggins”, “workflow automation”).
- Extracts **emotional tone** (e.g. “hopeful”, “urgent”, “anxious”).
- Stores **metadata** (platform, link, title, duration, timestamp).

###Embedding & Indexing
- Content is embedded semantically using Gemini or similar model.
- Stored in **Vector DB** for intelligent retrieval.
- Metadata is stored in **Firestore** for fast querying and structured access.


### Retrieval (AI-Powered Recall)

- **Direct Retrieval**

- User queries: “Find the TikTok I saved on how to fall asleep faster.”
- Conversational Agent detects *direct intent*.
- Search Agent uses the **query embedding** to fetch best match from **Vector DB**.
- Matched content is returned with title, source, summary, and user notes.

#### 🔸 2. Emotion-Based Retrieval

- User queries: “I feel stuck, give me something that helps.”
- NLP Agent extracts mood (“stuck”, “unmotivated”).
- NLP Agent generates counter-mood target (“focused”, “energized”).
- Combined emotion + time context is embedded and sent to Search Agent.
- Best-fit saved content is retrieved and returned with an **AI-generated action plan**.

#### 🔸 3. Global Context Retrieval

- Prompt: “The market’s down. Any saved advice?”
- Global Context Agent understands world/local events.
- Injects context (e.g. market crash, exam week, Ramadan) into query flow.
- Matching saved entries are retrieved based on *external relevance*.

#### 🔸 4. Reflective Retrieval from Journal

- User writes a journal entry or uploads a voice log.
- NLP Agent parses for sentiment, recurring ideas, pain points.
- Journaling is indexed into Vector DB and linked to saved content.
- AI retrieves emotionally resonant or helpful content based on journal tone.
- AI gives gentle reflection and a suggestion.

#### 🔸 5. Manual Dashboard Search

- User browses dashboard manually via filters:
  - By platform (YouTube, TikTok, etc.)
  - By tag or emotion
  - By date saved
  - By type (video, article, upload, journal)
- **Search bar** supports keyword + semantic search (via vector fallback).
- Users can preview, reclassify, or archive saved entries.



### 🔹 AI Agent Roles (Orchestration)

- **🧠 Classification Agent**: Handles all tagging, structuring, and metadata generation during content ingestion.
- **💬 Conversational Agent**: Main interface between user and AI. Classifies user input type, routes queries, delivers results, generates messages.
- **🔍 Search Agent**: Responsible for intelligent semantic matching of queries (description, emotion, or context) to saved content using the **Vector DB**.
- **🧠 NLP Agent**: Handles emotion detection, mood reversal synthesis, journaling sentiment parsing, topic clustering, and text abstraction.
- **🌐 Global Context Agent**: Pulls or interprets real-world events and injects external relevance into retrieval logic.


### 🔹 Dashboard Features

- **Inbox-style Collection View**:
  - Timeline of saved entries
  - Grouped by tag, emotion, date, or platform
- **Entry Cards**:
  - Thumbnail, title, platform icon, summary, personal notes
  - “Open”, “Reflect”, “Edit Tags”, “Delete”, “Send to AI”
- **Smart Feed Section**:
  - Proactive AI suggestions (resurfaced forgotten content)
  - Context-aware recommendations (“You usually need this on Mondays…”)
- **Journal Tab**:
  - Write or record journal entries
  - See past journals with AI feedback
  - Connected content recommendations
- **Chat Window**:
  - Natural chat interface with AI (retrieval, reflection, journaling support)
  - Inline content previews + embedded actions (e.g., “Watch Now”, “Reflect on This”)



### 🔹 System & Tooling

- **Firestore**: Primary database for user info, content metadata, journals, preferences.
- **Vector DB (e.g. Pinecone/Weaviate)**: Embedding store for semantic retrieval across all saved content and user journaling.
- **Gemini API**: Used for agent logic, summarization, tone detection, conversation flow, and journal reflections.
- **FastAPI Backend**: Handles agent orchestration, auth, storage logic, and API gateway for frontend.
- **Google Cloud Run**: Containerized deployment of services.
- **Firebase Auth**: User authentication, session security, basic auth flows.
- **Postman / cURL / Unit Tests**: Local testing infrastructure.



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
