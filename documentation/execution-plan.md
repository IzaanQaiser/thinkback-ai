🔗 [google-adk-hackathon-chat](https://chatgpt.com/c/683b9112-5ea4-8011-ad8b-dc86427dbcbc)
# execution-plan (010625-230625):
## ✅ **Phase 0 — Setup + Planning + Foundation + Branding (June 1)**

### 🧠 Ideation & Final Planning
~- Finalize agent list (5 total: classification, nlp, search, conversation, context)~ <br>
~- Finalize 3 core use case scenarios~<br>
~- Finalize MVP feature list (for June 1–23)~<br>
~- Finalize execution-plan (build phases + goal for each)~<br>
~- Make a file called `execution-plan.md` and push it to GitHub~

<br>

### 🛠️ Repo + Project Setup

~- Create GitHub repo (`thinkback-ai`)~<br>
~- Initialize with README + MIT License~<br>
~- Add folders:~<br>
  ~- `/documentation`~<br>
  ~- `/agents`~<br>
  ~- `/frontend`~<br>
  ~- `/backend`~<br>
~- Create `.gitignore`, `.env.example`, and initial commit~

<br>

### 📚 Learn the Tech & Platform (Google ADK)

~- [Read Google Hackathon Resources](https://googlecloudmultiagents.devpost.com/resources)~<br>

<br>

### ☁️ Google Cloud Setup

~- Go to [Google Cloud Console](https://console.cloud.google.com/)~<br>
~- Create project called `thinkback-ai`~<br>
~- Enable **Cloud Run**~<br>
~- Enable **Firestore**~<br>
~- Enable **Firebase Authentication**~<br>
~- Enable **Gemini API (Generative AI)**~<br>
~- Create service account + download credentials JSON~<br>
~- Store in `/infra/credentials/service-account.json`~<br>

<br>

### 🧪 Local Dev Tools

~- Install Node.js (via nvm or directly)~
~- Install Python 3.11+~
~- Install Firebase CLI (`npm i -g firebase-tools`)~
~- Install Google Cloud CLI~
~- Install ADK CLI (`pip install agentkit` or follow GitHub)~
~- Clone ADK sample repo and run it locally~
~- Confirm it works (i.e. run example with 2 agents)~
~- set up unit tests~
~- test scaffolding (FastAPI, Gemini, agents, firestone)~
~- **Install Postman or cURL** (for testing HTTP endpoints locally)~
~- **Create `.env.example`** file (document required env vars like API keys)~
~- **Add `.gitignore`** if not done (exclude `.venv`, `.env`, `__pycache__`, etc.)~
~- **Create `requirements.txt`** and run `pip freeze > requirements.txt` (so others can install dependencies easily)~
~- **Setup pre-commit hooks** (optional but pro — for formatting, linting)~

<br>

### 🔁 Diagrams for System Planning

* [ ] Sketch **System Flow Diagram** (how data moves end-to-end)
* [ ] Upload `system-flow-diagram.png` to `/docs/`
* [ ] Sketch **Agent Interaction Diagram** (who talks to who)
* [ ] Upload `agent-interaction-diagram.png` to `/docs/`
* [ ] Sketch **Dataflow Diagram** (Firestore, Gemini, etc.)
* [ ] Upload `dataflow-diagram.png` to `/docs/`

<br>

### 🎨 Branding & Storytelling

* [ ] Create `/branding` folder
* [ ] Inside, write `problem.md` → 3–5 bullets about the core inspiration + pain
* [ ] Write 2–3 strong **taglines**, e.g.:

  * "Save the media that matters. Retrieve it when it counts."
  * "Your memory for the internet."
* [ ] Pick font from Google Fonts (e.g. Satoshi, Inter, or Space Grotesk)
* [ ] Pick color palette (background, text, accent)
* [ ] Save in `branding/branding-guide.md`

<br>

### 📝 Blog Prep (for +0.4 bonus points)

* [ ] Pick blog platform: Dev.to, Medium, Hashnode, Substack
* [ ] Create account and title for post:

  * “How I built a multi-agent AI memory system with Google Cloud”
* [ ] Create blog outline (intro, pain point, agents, tech stack, lessons)
* [ ] Save as `blog-outline.md`

<br>

### 📹 Demo Prep

* [ ] Install screen recording tool (pick one):

  * OBS Studio
  * Loom
  * Screen Studio (paid, cleanest)
* [ ] Do 1 test recording (30 sec walkthrough)

<br>

### 🧾 Submission Checklist (start draft)

Create a file `submission-checklist.md` and add the following:

- [ ] Hosted URL
- [ ] GitHub repo (public)
- [ ] Architecture diagram
- [ ] Agent interaction diagram
- [ ] Demo video (<3 min)
- [ ] Text description (features, tools, Google Cloud usage)
- [ ] Blog post
- [ ] ADK GitHub contribution link
- [ ] Region: North America

<br>
<br>

## 🧱 **Phase 1 — Project + Agent Scaffolding (June 2)**

### 🔧 Backend Setup (ADK + API Base)

* [ ] `cd backend/`
* [ ] Create Python virtual environment:
  `python3 -m venv venv && source venv/bin/activate`
* [ ] Install dependencies:
  `pip install agentkit fastapi uvicorn python-dotenv`
* [ ] Create files:

  * `main.py` (entrypoint for FastAPI)
  * `agent_registry.py` (central agent loader)
  * `router.py` (handles external API calls like /save, /search)
* [ ] Run:
  `uvicorn main:app --reload`
  Confirm: `http://localhost:8000` works

<br>

### 🤖 ADK Agent Scaffolding

* [ ] `cd agents/`
* [ ] Create folders:

  * `classification_agent/`
  * `nlp_agent/`
  * `search_agent/`
  * `conversational_agent/`
  * `context_agent/`
* [ ] Inside each folder, create:

  * `agent.py`
  * `__init__.py`
* [ ] Inside `agent.py`, create base skeleton:

```python
from agentkit import Agent

class [AgentName](Agent):
    def __init__(self):
        super().__init__(name="[agent_name]")

    def run(self, message):
        # Placeholder logic
        return {"response": "placeholder"}
```

(Do this for all 5 agents)

* [ ] Import each agent into `agent_registry.py` so they can talk

<br>

### 💻 Frontend Bootstrap

* [ ] `cd frontend/`
* [ ] Run:
  `npx create-next-app@latest . --typescript`
* [ ] Install Tailwind:
  `npm install -D tailwindcss postcss autoprefixer`
  `npx tailwindcss init -p`
* [ ] Configure `tailwind.config.js` and `globals.css`
* [ ] Install Shadcn/UI:
  `npx shadcn-ui@latest init`

<br>

### 🧪 Frontend Pages (Static for Now)

* [ ] `/save`: input URL, tags, notes
* [ ] `/dashboard`: list of saved content (mock data for now)
* [ ] `/chat`: input box to talk to conversational agent

<br>

### 🔁 Local Agent-API Connect

* [ ] `POST /api/save`: route to `classification_agent`
* [ ] `POST /api/search`: route to `search_agent`
* [ ] `POST /api/suggest`: route to `nlp_agent + search_agent`
* [ ] Return dummy responses for now (e.g. `{ title: "Motivation Video", url: "..." }`)

<br>

### ✅ Deliverables by End of Day (June 2)

* [ ] Backend live on `localhost:8000`
* [ ] 5 agents created as Python classes using `agentkit`
* [ ] Frontend has 3 basic pages (`/save`, `/chat`, `/dashboard`)
* [ ] One dummy API call from frontend to backend (e.g. call /search and display result)
* [ ] Push to GitHub (`dev` branch)

<br>
<br>

## 📥 **Phase 2 — Core Agent Logic + Save Flow (June 3)**

### 🤖 classification\_agent: Make It Work

#### Step 1 — Basic Content Classification

* [ ] Go to `agents/classification_agent/agent.py`
* [ ] Add logic to:

  * Accept a URL or plain text
  * Generate dummy tags (e.g. `"motivation"`, `"finance"`)
  * Return `main_tag`, `secondary_tags`, `title`, and `timestamp`

```python
def run(self, message):
    content = message["content"]
    # fake logic for now
    return {
        "main_tag": "motivation",
        "secondary_tags": ["productivity", "energy"],
        "title": "Get More Done With Less Stress",
        "timestamp": "2025-06-02T12:00:00"
    }
```

#### Step 2 — Create `/save` Route

* [ ] In `backend/router.py`, add:

```python
from fastapi import APIRouter, Request
from agent_registry import classification_agent

router = APIRouter()

@router.post("/save")
async def save_content(req: Request):
    body = await req.json()
    result = classification_agent.run({"content": body["content"]})
    return result
```

* [ ] Connect `router.py` to `main.py`:

```python
from fastapi import FastAPI
from router import router

app = FastAPI()
app.include_router(router)
```

* [ ] Test with `curl` or Postman:

```bash
curl -X POST http://localhost:8000/save -H "Content-Type: application/json" -d '{"content": "video about being disciplined"}'
```

<br>

### 🧠 Local Memory (Mock DB for Now)

#### Step 3 — Store in-memory per user

* [ ] In `backend/data.py`, create:

```python
mock_db = {
  "user_1": []
}
```

* [ ] In `router.py`, modify `/save` route:

```python
from data import mock_db

# ...
mock_db["user_1"].append(result)
```

<br>

### 💻 Frontend — Connect Save Flow

#### Step 4 — Update `/save` page

* [ ] Add input field (`textarea`) for content URL or text
* [ ] Add submit button → `POST /api/save`
* [ ] On success, show confirmation
* [ ] Add call to backend via `fetch('/api/save')`

<br>

### 📋 Dashboard Page (Read from Mock DB)

#### Step 5 — View all saved entries

* [ ] In `/dashboard`:

  * Show mock data list (you can hardcode for now)
  * Format: `title`, `tags`, `timestamp`

<br>

### ✅ Deliverables by End of Day (June 3)

* [ ] classification\_agent adds tags + metadata
* [ ] `/save` API returns that data
* [ ] Data is saved to mock DB
* [ ] Frontend `/save` → backend → save content
* [ ] `/dashboard` displays saved mock data

Perfect — June 4 = **Phase 3: Real AI Agent Logic + Conversational Search**
🗓️ **Date: June 4, 2025**
🎯 Goal: Users can talk to the AI and retrieve saved content by description or emotion.

<br>
<br>

## 💬 **Phase 3 — Conversational + Search Agents (June 4)**

### 🧠 conversational\_agent: Understand the Request Type

#### Step 1 — Recognize "direct search" vs "vibe-based" (emotional) queries

In `agents/conversational_agent/agent.py`:

```python
from agentkit import Agent

class ConversationalAgent(Agent):
    def __init__(self):
        super().__init__(name="conversational_agent")

    def run(self, message):
        query = message["query"].lower()
        if any(x in query for x in ["find", "saved", "video", "article", "about"]):
            return {"intent": "direct_search", "query": query}
        elif any(x in query for x in ["feel", "help", "motivation", "stuck", "burnt"]):
            return {"intent": "emotional_search", "query": query}
        else:
            return {"intent": "unknown", "query": query}
```

<br>

### 🔍 search\_agent: Match saved entries to request

In `agents/search_agent/agent.py`:

```python
from agentkit import Agent
from data import mock_db

class SearchAgent(Agent):
    def __init__(self):
        super().__init__(name="search_agent")

    def run(self, message):
        query = message["query"]
        entries = mock_db["user_1"]
        # naive matching — later upgrade with vector search
        matches = [e for e in entries if query.split()[0] in e["title"].lower()]
        return {"results": matches}
```

<br>

### 🧠 nlp\_agent: For emotional queries, generate related keywords

In `agents/nlp_agent/agent.py`:

```python
class NLPAagent(Agent):
    def __init__(self):
        super().__init__(name="nlp_agent")

    def run(self, message):
        if "unmotivated" in message["query"]:
            return {"keywords": ["motivation", "focus", "energy"]}
        return {"keywords": ["general help"]}
```

<br>

### 🧠 conversational\_agent: Full loop (talk → delegate → return)

In `router.py`:

```python
from agent_registry import conversational_agent, search_agent, nlp_agent

@router.post("/chat")
async def chat(req: Request):
    body = await req.json()
    intent = conversational_agent.run({"query": body["query"]})

    if intent["intent"] == "direct_search":
        results = search_agent.run({"query": intent["query"]})
    elif intent["intent"] == "emotional_search":
        keywords = nlp_agent.run({"query": intent["query"]})["keywords"]
        results = search_agent.run({"query": keywords[0]})
    else:
        results = {"results": []}

    return results
```

<br>

### 💻 Frontend `/chat` Page

#### Step 2 — Connect to Backend

* [ ] Add a chat-style input box
* [ ] On submit, call `POST /api/chat` with user query
* [ ] Show returned results in a friendly format:

  * `title`
  * `main_tag`
  * `timestamp`

Use dummy data if you have to — real AI will come soon (Gemini integration in Phase 5).

<br>

### ✅ Deliverables by End of Day (June 4)

* [ ] Conversational agent handles direct vs emotional queries
* [ ] NLP agent generates keywords for emotion-based queries
* [ ] Search agent returns matched saved entries
* [ ] `/chat` works end-to-end: input → backend → results
* [ ] Dashboard and Save flow still working
* [ ] Push latest to GitHub

<br>
<br>

## 🔐 **Phase 4 — Firebase Auth + Firestore Persistence (June 5)**

### 🧱 Step 1: Firebase Project Setup

* [ ] Go to [https://console.firebase.google.com](https://console.firebase.google.com)
* [ ] Create a new project: `thinkback-ai`
* [ ] Enable **Authentication**

  * Choose **Email/Password** and **Google Sign-In**
* [ ] Enable **Firestore Database**

  * Set to *Start in test mode* (you’ll lock it down later)
* [ ] Go to **Project Settings → General**

  * Copy the Firebase config (`apiKey`, `authDomain`, etc.)
* [ ] Go to **Project Settings → Service Accounts**

  * Generate **Admin SDK Key** (download `firebase-adminsdk.json`)

<br>

### 🔧 Step 2: Firebase SDK in Backend

* [ ] Install Firebase Admin SDK

```bash
pip install firebase-admin
```

* [ ] Add `firebase_admin` to `backend/firebase.py`

```python
import firebase_admin
from firebase_admin import credentials, auth, firestore

cred = credentials.Certificate("firebase-adminsdk.json")
firebase_admin.initialize_app(cred)
db = firestore.client()
```

<br>

### 🔐 Step 3: Secure API Routes with Firebase Auth

* [ ] In `router.py`, write a helper:

```python
from firebase_admin import auth

def verify_token(token):
    decoded = auth.verify_id_token(token)
    return decoded["uid"]
```

* [ ] Update `/save` route:

```python
@router.post("/save")
async def save_content(req: Request):
    body = await req.json()
    token = req.headers["Authorization"].split("Bearer ")[1]
    uid = verify_token(token)

    result = classification_agent.run({"content": body["content"]})
    db.collection("users").document(uid).collection("saves").add(result)
    return result
```

* [ ] Do the same for `/chat`: query from Firestore instead of `mock_db`

<br>

### 💻 Step 4: Firebase SDK in Frontend

* [ ] Install Firebase Web SDK

```bash
npm install firebase
```

* [ ] In `lib/firebase.ts`:

```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  // rest of config here
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

* [ ] Add Google Sign-In + logout button in `/dashboard`:

```ts
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const provider = new GoogleAuthProvider();
signInWithPopup(auth, provider).then((res) => {
  localStorage.setItem("token", res.user.getIdToken());
});
```

<br>
<br>

### 📬 Step 5: Send Token on Requests

* [ ] Update all fetch calls:

```ts
const token = await auth.currentUser.getIdToken();
fetch("/api/save", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ content: input }),
});
```

<br>

### ✅ Deliverables by End of Day (June 5)

* [ ] Firebase auth is live (Google + email login)
* [ ] Firestore stores all saved entries by real user UID
* [ ] All API routes verify token and use Firestore
* [ ] Frontend login and logout flow works
* [ ] You can save, chat, and view dashboard **per user**

## 🤖 **Phase 5 — Gemini API + Semantic Understanding (June 6)**

🗓️ **Date: June 6, 2025**
🎯 Goal: Add **real semantic processing** with **Gemini Pro**
– For classifying saved content
– For handling emotional/NLP queries
– For smarter matching in search

---

### ✅ Step 1 — Enable Gemini API in Google Cloud

* [ ] Go to [Google Cloud Console → APIs & Services](https://console.cloud.google.com/apis)
* [ ] Enable: **Vertex AI API**
* [ ] Enable: **Generative Language API**
* [ ] Go to **Credentials → Create API Key**
* [ ] Copy the API key, save it to `.env`

```env
GEMINI_API_KEY=your_key_here
```

---

### 🧠 Step 2 — Use Gemini in classification\_agent

In `agents/classification_agent/agent.py`:

```python
import requests
import os

class ClassificationAgent(Agent):
    def __init__(self):
        super().__init__(name="classification_agent")

    def run(self, message):
        content = message["content"]
        prompt = f"""
You are an AI that helps classify internet media.
Given this content:
\"\"\"
{content}
\"\"\"
Generate:
- A main category (e.g., motivational, financial, entertainment, academic)
- 3 relevant tags
- 1–2 sentences of context summary
Return it as a JSON object.
"""

        res = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
            headers={"Content-Type": "application/json"},
            params={"key": os.environ["GEMINI_API_KEY"]},
            json={
                "contents": [{"parts": [{"text": prompt}]}]
            },
        )
        return res.json()["candidates"][0]["content"]["parts"][0]["text"]
```

✅ Now, `save` uses Gemini to actually understand and classify content.

---

### 💡 Step 3 — Use Gemini in NLP agent

In `agents/nlp_agent/agent.py`:

```python
class NLPAgent(Agent):
    def run(self, message):
        prompt = f"""
You are an NLP engine.
Given this user query: "{message['query']}", extract the user's emotional state and generate 3 keywords that would help them feel better.

Return a JSON with:
- emotion
- keywords
"""
        # same Gemini call structure as above
```

✅ Now, your **emotion-based search** has real understanding.

---

### 🔍 Step 4 — Smarter Matching in search\_agent

Replace naive keyword search with tag matching:

```python
def run(self, message):
    query = message["query"]
    user_entries = db.collection("users").document(uid).collection("saves").stream()
    # pull tags, context, etc., and match semantically (fuzzy match for now)
```

(You can upgrade this later with **vector embedding** if you want — let me know.)

---

### ✅ Deliverables by End of Day (June 6)

* [ ] Gemini API working
* [ ] `classification_agent` uses Gemini for tagging + summaries
* [ ] `nlp_agent` uses Gemini to detect emotion + give helpful tags
* [ ] `search_agent` matches based on Gemini-generated tags
* [ ] You can now save media → and **retrieve it smartly via chat**

<br>

💎 Optional Bonus (adds polish):

* [ ] Save original Gemini response in Firestore under `entry.analysis.rawGeminiOutput`

<br>
<br>

## 🧠 **Phase 6 — Timeline View, Smart Feed & Resurfacing (June 7)**

🗓️ **Date: June 7, 2025**
🎯 **Goal:** Display saved content in a **timeline**, and implement a **smart feed** that suggests resurfaced entries based on time, emotion, and relevance.

---

### ✅ Step 1 – Design Timeline View

* [ ] In your **Next.js frontend**, create a new `Timeline.tsx` component
* [ ] Each timeline item should show:

  * Title or summary
  * Date saved
  * Tags
  * Quick "Open" button
* [ ] Sort entries by timestamp (`created_at` from Firestore)

**Example card UI:**

```ts
{
  summary: "3 tricks to improve focus",
  tags: ["focus", "dopamine detox", "study"],
  created_at: "June 1, 2025",
}
```

<br>

### ✅ Step 2 – Design Smart Feed

* [ ] In your dashboard, create a section called **"Today’s Picks"**
* [ ] Use these criteria to pick 1–3 entries:

  * Saved exactly 7, 14, or 30 days ago
  * Has tags like "motivation", "reflection", "plan", or "reset"
  * Gemini classification score (if available)
* [ ] Use Firestore queries like:

```js
const lastWeek = today.minus(7, "days");
query where date == lastWeek and tags containsAny ["motivation", "plan"]
```

* [ ] Show: “🧠 You saved this 2 weeks ago. Want to revisit it?”

<br>

### ✅ Step 3 – Passive Resurfacing Logic

In backend (`agents/context_agent/agent.py` or central engine):

* [ ] Write a daily check for:

  * "What entries are time-relevant today?"
  * "What entries match recent user emotion queries?"
* [ ] Store `lastSuggestedAt` timestamp in each entry to avoid duplicates
* [ ] Return a list of resurfaced entries to the frontend feed

<br>

### ✅ Step 4 – Smart Feed + Timeline UI Polish

* [ ] Add filters (e.g., show only motivational entries)
* [ ] Add emoji/icon for tag category (💼 finance, 🧠 mindset, ⚡ energy)
* [ ] Optional: Add a “Rewind” button → view all entries from this day 1/2/4 weeks ago

<br>

### ✅ Step 5 – Firestore Cleanup (optional)

Make sure all saved entries in Firestore include:

* `created_at` timestamp
* `main_tag`
* `tags` (array)
* `summary` or description
* `lastSuggestedAt` (nullable)

<br>

### 🧪 Bonus Polish (Optional)

* [ ] Animate new entries fading into the feed
* [ ] Add a “why this?” tooltip to smart suggestions

<br>

### ✅ Deliverables by End of Day (June 7)

* [ ] Timeline of saved content (chronologically sorted)
* [ ] Smart Feed that suggests resurfaced entries from past
* [ ] Backend logic to filter + return suggestions
* [ ] Emojis/icons/tags for visual personality

<br>
<br>

## 🤖 **Phase 7 — Agent Communication & Context Pipeline (June 8)**

🗓️ **Date:** June 8, 2025
🎯 **Goal:** Stitch all 5 agents into a real working **multi-agent pipeline** using Google ADK — so they can pass messages, context, and results between each other.

---

### 🧩 Step 1 – Understand the Agent Flow

Draw this out (mentally or Figma):

> **User Message** → Convo Agent → (if emotional) NLP Agent → Global Context Agent
> → All context → Search Agent → Result → Back to Convo Agent → Back to User

There are **2 paths**:

* **Direct query** (e.g., "I saved a video about habits") → Convo → Search
* **Emotional query** (e.g., "I feel lost") → Convo → NLP → Context → Search

<br>

### 🧠 Step 2 – Define Shared Context Schema

Create a shared object called `context` that gets passed between agents:

```json
{
  "user_id": "abc123",
  "query_type": "emotional" | "direct",
  "raw_message": "i feel lost",
  "emotion_tags": ["burnout", "confusion"],
  "positive_tags": ["clarity", "motivation"],
  "global_tags": ["summer", "exam season", "AI news"],
  "final_tags_to_search": [...],
  "history": []
}
```

* [ ] Put this in a shared file like `/core/context.py`
* [ ] Update each agent to accept and mutate the `context` object

<br>

### 🔌 Step 3 – Convo Agent → NLP Agent Integration

* [ ] If user query includes emotional language (e.g., “I feel…” or “I'm struggling…”):

  * [ ] Convo agent forwards message to NLP agent
  * [ ] NLP agent extracts:

    * Emotional state
    * Opposite-positive state
    * Keywords
  * [ ] NLP agent updates `context` with those tags

<br>

### 🌐 Step 4 – Global Context Agent Integration

* [ ] NLP passes emotional tags → Global Context Agent
* [ ] Global agent pulls relevant tags from:

  * Static list (e.g., "summer", "exams", "AI layoffs", "Monday blues")
  * Gemini (optional prompt-based)
* [ ] Global agent appends global tags into context

<br>

### 🔍 Step 5 – Search Agent Logic

* [ ] Accepts final `context.final_tags_to_search`
* [ ] Queries Firestore for top-matching entries using:

```ts
where tags array-contains-any [tags]
order by score / time
limit 3
```

* [ ] Returns content IDs + summary → context.result

<br>

### 🗣️ Step 6 – Convo Agent Final Response

* [ ] If search returns nothing → respond: “Couldn’t find anything for that yet. Want to save something new?”
* [ ] If content found:

  * Show 1–3 cards with: title, summary, date
  * Respond with motivational copy like:
    *“You saved this last month. It might help now.”*
    *“Here’s what past-you thought future-you would need.”*

<br>

### ⚙️ Step 7 – Connect Agents via Google ADK (Minimal Example)

Use ADK’s **agent engine** to wire this up:

* [ ] Define all agents in `/agents.json`
* [ ] Use ADK CLI to test end-to-end communication
* [ ] Log context object at each step to verify correctness

<br>

### 🔄 Step 8 – Test Flows

**Emotional Query Test:**
“I feel like I’m falling behind”
✅ NLP → burnout → motivation → Search → 3 saved videos → Convo response

**Direct Query Test:**
“I saved a reel about dopamine detox”
✅ Search → find entry → respond

<br>

### 🧪 Bonus (Optional)

* [ ] Write unit test for `context` object
* [ ] Store `last_used_query_type` in Firestore per user
* [ ] Animate convo agent reply in frontend

<br>

### ✅ Deliverables for June 8

* [ ] Agents talk to each other using shared `context`
* [ ] Both emotional and direct queries supported
* [ ] ADK-powered agent flow fully working
* [ ] Results are returned to frontend

<br>
<br>


## ✅ **Phase 8 — Testing, Performance, and Final Submission (June 10)**

🗓️ **Date:** June 10, 2025
🎯 **Goal:** Ensure Thinkback.ai is bug-free, fast, secure, and 100% ready for submission — no surprises on demo day.

---

### 🧪 Step 1 – Manual Testing (Core Features)

* [ ] **Auth:**

  * [ ] Sign in / Sign out works with Google
  * [ ] User-specific data is isolated

* [ ] **Save Flow:**

  * [ ] Save a YouTube or TikTok link
  * [ ] Classification is accurate (real or mock tags)

* [ ] **Dashboard:**

  * [ ] Shows saved cards cleanly
  * [ ] Handles empty states

* [ ] **Chat:**

  * [ ] “I saved X” returns correct item
  * [ ] “I feel Y” returns relevant suggestion
  * [ ] Graceful fallback if no match found

* [ ] **Timeline Feed:**

  * [ ] Most recent + resurfaced entries shown
  * [ ] Good loading performance

<br>

### 🚀 Step 2 – Performance Checklist

* [ ] **Lazy load** content where needed
* [ ] **Minify/optimize** assets
* [ ] **Use Firebase Hosting preview** to test in production
* [ ] Enable Vercel/Netlify or Firebase hosting for live URL

<br>

### 🔐 Step 3 – Security Check

* [ ] Firebase rules:

```json
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

* [ ] Auth-protect any backend routes
* [ ] Hide API keys (Gemini, Firebase) with `.env` and don’t commit them

<br>

### 🔍 Step 4 – Code Cleanup

* [ ] Remove console logs, test artifacts
* [ ] Comment complicated logic
* [ ] Write 1–2 unit tests (even dummy ones) if time

<br>

### 📂 Step 5 – GitHub Final Polish

* [ ] `README.md` includes:

  * [ ] 1-paragraph project summary
  * [ ] Tech stack
  * [ ] Setup instructions
  * [ ] Demo link
  * [ ] Blog post link
  * [ ] Submission credits

* [ ] Folder structure cleaned and consistent

* [ ] Add MIT License or similar (optional)

<br>

### 🧾 Step 6 – Final Submission Review

Go to Devpost and double-check:

* [ ] Project title ✅
* [ ] Taglines ✅
* [ ] Demo video ✅
* [ ] GitHub link ✅
* [ ] Tech used ✅
* [ ] Blog post ✅ (bonus)
* [ ] Open-source contribution ✅ (bonus)
* [ ] Challenges + prizes targeted ✅
* [ ] Description section fully filled ✅

<br>

### 💣 Step 7 – Backup and Save

* [ ] Push all code to GitHub
* [ ] Record final walkthrough video
* [ ] Screenshot every major screen
* [ ] Backup blog post as PDF

<br>

### ✅ Deliverables for June 10

* [ ] All core features fully tested
* [ ] Hosting link works
* [ ] Final Devpost submission is *locked and loaded*
* [ ] Codebase is clean, secure, and complete

<br>
<br>

## 🧠 **Phase 9 — Full AI Integration + Remove All Hardcoding**

🗓️ **Date:** June 9, 2025
🎯 **Goal:** Replace every hardcoded logic path with real AI-powered behavior using Gemini and Firestore. This phase makes Thinkback.ai *actually* smart.

---

### ✅ Step 1 – Gemini-Only Classification Agent

* [ ] Replace ALL dummy tagging logic in `classification_agent`
* [ ] Use Gemini Pro to classify ANY content (YouTube URL, article, notes, etc.)

```python
# classification_agent/agent.py
prompt = f"""
You are an intelligent media classifier.

Given this content:
\"\"\"{message['content']}\"\"\"

Return a JSON:
{
  "main_tag": "...",
  "secondary_tags": [...],
  "summary": "...",
  "timestamp": ISO string
}
"""
# Run Gemini call and return actual parsed JSON
```

✅ No more `"motivation"` placeholders.

<br>

### ✅ Step 2 – Gemini-Based NLP Agent

* [ ] In `nlp_agent`, remove static keyword/emotion mapping
* [ ] Replace with prompt like:

```python
prompt = f"""
You are an NLP agent that detects emotion and gives search guidance.

Input: "{message['query']}"

Return JSON:
{
  "detected_emotion": "...",
  "suggested_keywords": [...],
  "response_tone": "...",
}
"""
```

✅ This makes the emotional queries actually smart and human.

<br>

### ✅ Step 3 – Search Agent → Semantic Matching (via Gemini)

🔥 This is the BIGGEST upgrade.

* [ ] Instead of:

```python
if "motivation" in entry["title"]:
```

* [ ] Use Gemini to compare a **user query** to saved **Firestore entries**:

```python
# search_agent/agent.py
query = message["query"]
entries = fetch_user_entries(uid)

prompt = f"""
User is searching for: "{query}"

Here are their saved entries:

{json.dumps(entries)}

Pick the top 3 that best match the query. Return their IDs.
"""
# Gemini outputs 3 most relevant entry IDs
```

✅ Real semantic retrieval, not keyword nonsense.

<br>

### ✅ Step 4 – Conversational Agent Rewrite (No If-Else Hell)

* [ ] Gemini handles **intent detection** (no hardcoded keyword ifs)

```python
prompt = f"""
You are a conversational intent recognizer.

Input: "{message['query']}"

Return JSON:
{
  "intent": "direct_search" | "emotional_search" | "save_content",
  "extracted_keywords": [...],
  "requires_context": true/false
}
"""
```

* [ ] Route intelligently based on this.

<br>

### ✅ Step 5 – Remove ALL MockDB, Switch to Firestore Everywhere

* [ ] Delete `mock_db.py`
* [ ] Search agent, classification agent, NLP agent → all use Firestore
* [ ] Add helpers to:

```python
from firebase_admin import firestore

def fetch_user_entries(uid):
    return db.collection("users").document(uid).collection("saves").stream()
```

✅ Real persistent, multi-user memory.

<br>

### ✅ Step 6 – Smart Tag Embeddings (Optional Polishing)

* [ ] Use Gemini to generate **semantic embeddings** for tags/titles
* [ ] Store embedding vector with each save

```python
prompt = f"""
Embed this content title semantically for AI search: "{entry['title']}"
Return a 768-d float array.
"""
```

* [ ] Later: do cosine similarity search for best match.

<br>

### ✅ Step 7 – Smart Feed Logic → Full Gemini

* [ ] Instead of:

> “Show videos saved 7 days ago with ‘motivation’ tag”

* [ ] Use prompt:

```python
prompt = f"""
Today is June 9. The user previously saved these entries:
{json.dumps(entries)}

Select 2 entries to resurface today based on time, theme, emotion, or life context.

Return their IDs + reason.
"""
```

✅ Your Smart Feed is now a true AI assistant.

<br>

### ✅ Step 8 – Fallback Logic → Gemini-Generated Replies

If nothing found in search or feed:

```python
prompt = f"""
The system couldn’t find matching entries for the query: "{query}"

Generate a graceful, supportive fallback response.
"""
```

✅ You sound like ChatGPT, not a broken app.

<br>

### ✅ Step 9 – Final Gemini Util Tools

* [ ] Create `/core/gemini_utils.py`:

```python
def call_gemini(prompt: str) -> str:
    # Handles auth, retries, errors
```

✅ Centralized, reusable, clean.

<br>

### ✅ Step 10 – Full App Test (Post-AI Integration)

* [ ] Save content → Gemini classifies + stores
* [ ] Chat query (direct/emotional) → Gemini extracts intent, tags
* [ ] Search runs → Gemini matches relevant saved items
* [ ] Timeline + Smart Feed show meaningful resurfaced items
* [ ] Fallbacks sound supportive and clear

<br>

### ✅ Deliverables by End of Day (June 11)

* [ ] **No hardcoded logic remains**
* [ ] Every agent uses Gemini for reasoning or classification
* [ ] Firestore powers all user content
* [ ] Smart Feed and Search fully semantic
* [ ] Gemini prompt engineering lives in the app, not in your head

<br>
<br>

## ✅ **Phase 10 – June 12: Global Context Agent + Contextual Retrieval**

**Goal:**
- Make Thinkback truly *aware* of real-world context — news, events, seasons, trends — and use that to suggest relevant saved content.
- Implement the **Global Context Agent**, and pipe its context into the smart feed + suggestion workflows.

---

### 1. **Design Context Scope**

* [ ] Define which global events to consider (e.g., stock market, seasonal dates, major holidays, news trends).
* [ ] Create a sample global context object schema:

```ts
{
  timestamp: "2025-06-12T12:00:00Z",
  market_status: "bearish",
  date_marker: "early summer",
  global_keywords: ["student burnout", "summer vacation", "AI layoffs"]
}
```

<br>

### 2. **Create `global-context-agent`**

* [ ] Create new agent using `adk init agent global-context-agent`
* [ ] Add logic to:

  * [ ] Use Gemini to summarize world context from a daily trending topics list (can use Google News RSS, pre-curated headlines, or dummy source for now).
  * [ ] Pipe this as a formatted JSON to downstream agents.

<br>

### 3. **Inject Global Context into Workflows**

* [ ] Modify **Search Agent** and **Suggestion Flow** to:

  * Accept `globalContext` alongside `nlpContext` and `userQuery`
  * Match saved content tags/metadata against trending or relevant keywords
  * Add small boost to matching content that’s *globally relevant right now*

<br>

### 4. **Use Gemini to Parse Global→User Matching**

* [ ] Create a Gemini prompt template that says:

```plaintext
Given a user’s saved content and the following global trends:
[JSON globalContext]
Which content is likely to feel relevant, helpful, or interesting for the user *right now*?
Return top 3 item IDs and short explanations.
```

<br>

### 5. **Update Smart Feed**

* [ ] In Smart Feed pipeline:

  * [ ] Fetch global context
  * [ ] Run matching via search agent
  * [ ] Display a “Because of recent events” label on surfaced content

<br>

### 💄 Bonus Polish (Optional)

* [ ] Add a subtle banner above Smart Feed:

  > 🛰️ "These recommendations were based on current global trends."
* [ ] Log global context to Firestore under `/analytics/globalSnapshots` for inspection
* [ ] Store last-used global context per user to avoid duplicate surfacing

<br>
<br>

## 📓 **Phase 11 — Journaling + Reflective AI Loop**

🗓️ **Date:** June 13, 2025
🎯 **Goal:** Let users write emotional/reflective journal entries and have Thinkback.ai extract feelings, summarize thoughts, suggest relevant saved content, and even generate action plans.

---

### ✅ Step 1 — Create `/journal` Page (Frontend)

* [ ] Add new route: `pages/journal.tsx`

* [ ] Design layout:

  * Large `textarea` input for journal entry
  * “Analyze” button
  * Space below to show:

    * Summary of journal
    * Detected emotion/tags
    * Suggested saved content
    * Suggested action plan (if applicable)

* [ ] Optional:

  * Store past entries and show them in a collapsible list

<br>

### ✅ Step 2 — Backend Endpoint: `/analyze-journal`

In `router.py`:

```python
@router.post("/analyze-journal")
async def analyze_journal(req: Request):
    body = await req.json()
    content = body["content"]
    uid = verify_token(req.headers["Authorization"].split("Bearer ")[1])

    result = nlp_agent.run({"query": content})
    summary = summarization_agent.run({"content": content})

    matching = search_agent.run({"query": result["keywords"]})

    return {
        "summary": summary,
        "emotion": result["emotion"],
        "keywords": result["keywords"],
        "matches": matching["results"]
    }
```

<br>

### ✅ Step 3 — NLP Agent (Emotional Classifier)

In `nlp_agent/agent.py` (if not already real AI):

* [ ] Use Gemini to classify emotion and extract keywords.

```python
def run(self, message):
    prompt = f"""
    You're an AI therapist. A user wrote:

    \"{message['query']}\"

    Extract:
    - Main emotion (e.g., burnout, motivation, anxiety)
    - 3 keywords/topics
    Return JSON.
    """
    # Send this to Gemini
```

<br>

### ✅ Step 4 — Summarization Agent

Create new agent: `summarization_agent/agent.py`

```python
from agentkit import Agent
import requests, os

class SummarizationAgent(Agent):
    def __init__(self):
        super().__init__(name="summarization_agent")

    def run(self, message):
        content = message["content"]
        prompt = f"Summarize this journal entry in 1–2 sentences:\n{content}"
        # Send to Gemini (reuse same pattern)
```

Register it in `agent_registry.py`.

<br>

### ✅ Step 5 — Match Journal With Saved Media

* [ ] From `keywords` (from NLP agent), call `search_agent`
* [ ] If matches found:

  * Return top 3 entries
  * Include in response to frontend

<br>

### ✅ Step 6 — AI-generated Reflection Plan (Optional Polish)

* [ ] Add an additional prompt to Gemini like:

```txt
Based on this journal entry:
"{entry}"

Generate a simple 3-step action plan to help this user feel better or solve their issue. Format as a bullet list.
```

→ Display under "Suggested Next Steps"

<br>

### ✅ Step 7 — Frontend Display (Final Polish)

After journal is submitted:

* Show cards:

  * 📝 **Summary** of their journal
  * 😥 **Emotion** + keywords
  * 💾 **Saved media** they should revisit
  * ✅ **Action Plan** (if available)

* Use beautiful card UI (like dashboard)

<br>

### ✅ Deliverables by End of Day (June 13)

* [ ] `/journal` route exists
* [ ] Users can write emotional/reflective entries
* [ ] Gemini extracts emotions, summary, and keywords
* [ ] Search agent finds relevant saved content
* [ ] Optional: Gemini suggests an action plan
* [ ] Frontend shows clean, calm, helpful UI
* [ ] Everything is tied into the multi-agent loop properly

<br>
<br>

## 🧠 **Phase 12 – Journal Feature Full Integration**

---

### ✍️ 1. **Frontend: Journal UI Page**

* [ ] Create new page: `/journal`
* [ ] UI Components:

  * [ ] **Text editor** (`<textarea>` or rich text)
  * [ ] **“Analyze Entry”** button
  * [ ] Display area for:

    * Summary
    * Tags/emotions
    * Suggested media
* [ ] Add success/error states + loading indicators
* [ ] Add page to navbar + route structure

<br>

### 🧠 2. **Backend: Add `/journal` Route**

In `backend/router.py`:

* [ ] Create endpoint: `POST /journal`
* [ ] Payload: `{ uid, content }`
* [ ] Steps:

  * [ ] Verify token
  * [ ] Run journal entry through **Gemini**:

    * Get emotion
    * Get key insights
    * Get suggested positive focus
  * [ ] Store result in `firestore.users.{uid}.journals`

Example schema:

```json
{
  "content": "I've been really tired and unfocused...",
  "summary": "Feeling burnt out due to workload",
  "emotion": "burnout",
  "positive_tags": ["focus", "discipline", "routine"],
  "timestamp": "2025-06-13T12:00:00Z"
}
```

<br>

### 🔍 3. **NLP Agent: Journal Mode**

In `nlp_agent/agent.py`:

* [ ] Add `mode="journal"` logic:

```python
if message.get("mode") == "journal":
    # Specialized Gemini prompt for journaling
    prompt = f"""
You're a helpful assistant that analyzes personal journal entries.
Given this journal text:
\"\"\"
{message['content']}
\"\"\"

1. Summarize it in 1–2 lines.
2. Identify emotional tone (burnout, anxiety, optimism, etc.)
3. Suggest 3 helpful focus areas or keywords for the user.

Return a JSON like:
{{
  "summary": "...",
  "emotion": "...",
  "positive_tags": ["...", "...", "..."]
}}
"""
```

<br>

### 📚 4. **Firestore: Journal Collection**

* [ ] Path: `users/{uid}/journals`
* [ ] Fields:

  * `content`, `summary`, `emotion`, `positive_tags`, `timestamp`
* [ ] Add optional field: `suggested_media` (can come later)

<br>

### 💡 5. **Smart Feed: Journal-Driven Suggestions**

* [ ] In context agent:

  * If user posts a journal entry, use `emotion` + `positive_tags`
  * Query media that matches those tags
  * Surface old saved entries relevant to the journal state

<br>

### 📆 6. **Timeline View Update**

* [ ] Add journal entries to main timeline (different icon/emoji)
* [ ] Color code by emotion (e.g. 🔴 burnout, 💙 calm, ⚡ motivation)
* [ ] Add filter: `show only journal entries`

<br>

### 🧪 7. **Testing Checklist**

* [ ] Write & save journal entry
* [ ] Confirm Gemini analysis
* [ ] Confirm Firestore entry created
* [ ] Check Smart Feed updates
* [ ] View entry in timeline

<br>

### ✅ Deliverables for June 13

* [ ] `/journal` page live with full UX
* [ ] Backend route stores analyzed entries
* [ ] NLP agent processes journal text via Gemini
* [ ] Entries saved to Firestore correctly
* [ ] Timeline and Smart Feed include journal-driven content
* [ ] All connected pieces are working smoothly
* [ ] Push to GitHub and test user flow E2E

<br>
<br>

## **Phase 13 — Voice Journaling, Reminders & Memory Agent Integration**

---

### 🎤 Step 1 — Voice-to-Text Journaling Input (Frontend)

* [ ] Install the Web Speech API (browser-native — no extra dependency)
* [ ] Add a microphone icon to `/journal` page
* [ ] On click: start voice capture using `SpeechRecognition`
* [ ] Auto-fill the journal `textarea` with transcribed text
* [ ] Add toggle: 🎙️ “Start/Stop Recording”

```ts
const recognition = new window.SpeechRecognition();
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  setJournalInput(transcript);
};
```

✅ Now users can speak journal entries and submit without typing.

<br>

### ⏰ Step 2 — Smart Reminder System (Passive + Trigger-Based)

**Option A — Passive Reminder Card (Frontend)**

* [ ] If no journal entry exists for today:

  * Show: “📝 Feeling something today? Log it before the day ends.”
* [ ] If last entry was emotional:

  * Show: “😔 Yesterday you felt overwhelmed. Want to reflect today?”

**Option B — Triggered Suggestions (Agent)**

* [ ] In the **context\_agent**, add:

  * “Has this user journaled today?”
  * If not, and user says something emotion-related → return journaling nudge

✅ You nudge users **organically** without being annoying.

<br>

### 🧠 Step 3 — Journal Memory Agent Logic

Update `context_agent` to do the following:

* [ ] When user enters `/chat` with emotional tone:

  * Search recent journal entries (past 7 days)
  * Extract most common emotions and topics
  * Inject them into the context object (e.g. `"recent_emotions": ["burnout", "self-doubt"]`)
* [ ] Use this for better NLP-agent suggestions or even surface past insights:

  * *“Last time you felt like this, you wrote: 'I need to sleep more.' Want to revisit that?”*

✅ This makes journaling **actually useful**, not just decorative.

<br>

### 🔁 Step 4 — Link Journal to Timeline & Smart Feed

* [ ] Add journal entries to the **timeline** with different visual tags (`type: journal`)
* [ ] In Smart Feed logic:

  * Resurface journal entries from 1/2/4 weeks ago
  * Show past thoughts tied to current emotional states
* [ ] Add filters:

  * View only saved content
  * View only journal entries
  * View all

✅ This gives users a unified memory experience — thoughts + media.

<br>

### ✨ Step 5 — Final Polish for `/journal` Page

* [ ] Add icons based on emotion detected in Gemini response (😔 🧠 ⚡ 🪷)
* [ ] Clean up Gemini reflection output (paragraphs, headers, etc.)
* [ ] Add loading spinner when analyzing entry
* [ ] Allow deleting or editing journal entries (Firestore + frontend)
* [ ] Auto-scroll to response after submission

<br>

### ✅ Deliverables by End of Day (June 14)

* [ ] Voice journaling works
* [ ] Smart journaling reminder shown when needed
* [ ] Journal memory integrated into agent reasoning
* [ ] Journal entries appear in timeline + smart feed
* [ ] `/journal` polished for demo-ready status

<br>
<br>

## **Phase 14 — Insights Dashboard, Export, & Final UX Polish**
🗓️ **Date:** June 15, 2025
🎯 **Goal:** Give users a full-circle experience with exportable data, visual insights, and polished UX — making the app demo- and investor-ready.

---

### 📊 Step 1 — **Insights Dashboard**

Add a new page: `/insights`
This page visualizes patterns in the user's saved content & journals.

### Key Sections:

* ✅ **Mood Trends (Last 30 Days)**

  * Line or area chart of detected emotions over time (from journal agent)
  * Use emojis or tags: 🧠 motivation, 😔 sadness, 💪 energy, 🪷 peace

* ✅ **Tag Frequency**

  * Bar chart or tag cloud showing most used tags across saved media + journals

* ✅ **Media vs. Journaling Balance**

  * Pie chart or stacked bar showing ratio of:

    * Content saved (videos, articles, etc.)
    * Journals written

* ✅ **Recent Patterns Detected**

  * Gemini-powered insight card (e.g.):

    * “You tend to journal about focus late at night.”
    * “You save more motivational content on Mondays.”

<br>

### 📁 Step 2 — **Export Data Feature**

Give users ownership of their memories.

* [ ] Add “Export My Data” button on `/insights`
* [ ] On click:

  * Fetch all entries (saved content + journals) for the user
  * Structure as JSON or Markdown
  * Trigger download with filename: `thinkback_export_YYYYMMDD.json`

Optional:

* [ ] Let user choose:

  * Export format (JSON / CSV / Markdown)
  * Export range (last 7 / 30 / all time)

<br>

### ✨ Step 3 — Final UX Polish

* [ ] Smooth loading animations across all pages

* [ ] Refined typography + spacing in:

  * `/chat` responses
  * `/dashboard` cards
  * `/journal` and `/insights`

* [ ] Add subtle hover animations on buttons, cards, icons

* [ ] Scroll to top on route change

<br>

### 🧪 Step 4 — Manual QA Pass

Test every interaction *like a new user*:

* [ ] Create new account → save → journal → chat → reflect
* [ ] Try weird inputs:

  * Submit blank journal
  * Ask for content that doesn’t exist
* [ ] Check for bugs in:

  * Routing
  * Token usage
  * Broken links / loaders

<br>

### ✅ Deliverables by End of Day (June 15)

* [ ] `/insights` shows real user data trends
* [ ] Export to `.json` or `.md` works cleanly
* [ ] App feels smooth, modern, professional
* [ ] All key pages styled and responsive
* [ ] QA checklist completed

<br>
<br>

## **Phase 15 — Final Demo, Submission, and Marketing Prep**
🗓️ **Date:** June 16, 2025
🎯 **Goal:** Prepare a polished **demo**, complete your **Devpost submission**, and create marketing assets that show Thinkback.ai is a serious, YC-ready product.

---

### 🎥 Step 1 — Record Final Demo Video

### Script (\~3 min max):

1. **Intro (15 sec):**

   > “This is Thinkback.ai — your second brain for the internet. It saves what matters and resurfaces it when you need it most.”

2. **Save Flow (30 sec):**

   * Show `/save` → paste content → categorize by AI → appears on `/dashboard`

3. **Chat Retrieval (30 sec):**

   * Show `/chat` → query based on vibe (e.g., “I feel stuck”) → gets resurfaced entries

4. **Journal Flow (30 sec):**

   * Show `/journal` → record or write → gets reflected and saved → appears in `/dashboard` and `/insights`

5. **Insights + Export (30 sec):**

   * Go to `/insights`, highlight:

     * Mood chart
     * Tag frequency
     * “Export My Data” button

6. **Wrap Up (15 sec):**

   > “Built with Google ADK and Gemini. Thinkback.ai is memory with meaning.”

<br>

### 🧠 Step 2 — Devpost Final Submission

Make sure these are ✅ before June 23:

* [ ] Title: **Thinkback.ai — Memory with Meaning**
* [ ] Short tagline
* [ ] Full description (you already have this)
* [ ] Demo video link
* [ ] GitHub link
* [ ] Hosted app link (Firebase, Vercel, etc.)
* [ ] Tech used:

  * Gemini API, Google ADK, Firebase, Firestore, Tailwind, Next.js
* [ ] Diagram uploads:

  * Architecture
  * Agent pipeline
  * UX flow
* [ ] Blog post (optional bonus)
* [ ] ADK GitHub contribution (optional bonus)

<br>

### 🧲 Step 3 — Marketing Assets (Optional, But Boosts Points)

### Branding Folder

* [ ] `/marketing/`

  * `logo.svg` and `logo-dark.svg`
  * App screenshots (auth, dashboard, chat, insights, etc.)
  * Short punchy slogans:

    * “Talk to your past self.”
    * “The internet never forgets — now you don’t have to.”
    * “Save the content that saves you.”

### LinkedIn Post (Optional)

* [ ] Template:

> Just built Thinkback.ai — your memory for the internet.
> Save media that matters. Journal your growth.
> AI brings it back when you need it.
>
> Proudly built for the Google Cloud #adkhackathon
> 👉 \[Live Demo Link]
> 👉 \[Devpost]

<br>

### 🧾 Step 4 — Final Checklist

* [ ] All frontend pages styled and working
* [ ] Auth + Firestore + agents fully functional
* [ ] Journal, chat, timeline, and smart suggestions working
* [ ] Hosting is live
* [ ] GitHub repo cleaned
* [ ] Demo video uploaded
* [ ] Devpost submission filled out
* [ ] Blog post (optional) written and linked

<br>

### ✅ Deliverables by End of Day (June 16)

* [ ] Demo video recorded + uploaded
* [ ] Devpost draft fully ready
* [ ] Marketing folder created
* [ ] All submission criteria covered
* [ ] Everything pushed to GitHub and deployed

<br>
<br>

## **Phase 16 — Bug Bash, Accessibility & Mobile Polish**
🗓️ **Date:** June 17, 2025
🎯 **Goal:** Hunt down bugs, polish mobile responsiveness, and add accessibility upgrades to ensure Thinkback.ai works cleanly for every user and looks production-ready.

---

### 🐛 Step 1 — Bug Bash (Manual Testing)

Go page-by-page and test **everything**:

#### 🔐 Auth

* [ ] Sign in / out works
* [ ] User data is scoped per UID
* [ ] Invalid users are redirected or blocked

#### 💾 Save Flow

* [ ] `/save` inputs work on all screen sizes
* [ ] Submit content → shows confirmation
* [ ] Entry appears in dashboard
* [ ] Bad input (empty field) is handled gracefully

#### 💬 Chat Agent

* [ ] Emotional queries return relevant content
* [ ] Direct queries retrieve correct past content
* [ ] Unexpected input doesn’t crash the app
* [ ] Loading states and errors are handled

#### 📘 Journal

* [ ] You can type or voice-record entries
* [ ] Reflections are shown and saved
* [ ] Insights are updated accordingly

#### 📊 Insights

* [ ] Graphs/charts load with real data
* [ ] Clicking entries shows more info
* [ ] Export button works

#### 🕒 Timeline & Resurfacing

* [ ] Saved entries appear chronologically
* [ ] "Smart feed" suggestions show correctly
* [ ] Empty states look nice

<br>

### 📱 Step 2 — Mobile Responsiveness

Test on these screen sizes (use browser DevTools):

* [ ] **iPhone SE / XR / 14**
* [ ] **Pixel 6 / Galaxy S21**
* [ ] **iPad**
* [ ] **Small laptop (13")**

#### What to check:

* [ ] Buttons and inputs are not cut off
* [ ] Modals/dialogs scale properly
* [ ] Navigation is easy (if present)
* [ ] Font sizes are readable
* [ ] Nothing overlaps or breaks layout

Use Tailwind’s responsive utilities if needed:

```tsx
<p className="text-sm md:text-base lg:text-lg">...</p>
```

<br>

### ♿ Step 3 — Accessibility (A11Y) Pass

Follow WCAG basics:

* [ ] All inputs have `label` or `aria-label`
* [ ] Buttons are `role="button"` if needed
* [ ] Use semantic HTML (e.g., `<main>`, `<section>`)
* [ ] Ensure keyboard navigation works
* [ ] Use sufficient contrast (check [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/))

Optional: use [axe DevTools extension](https://www.deque.com/axe/devtools/) to catch violations.

<br>

### 🔒 Step 4 — Final Security Checks

* [ ] No `.env` or sensitive keys are committed
* [ ] Firebase rules prevent data leakage

```json
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

* [ ] Gemini API key is stored securely on backend only

<br>

### ✅ Deliverables for June 17

* [ ] All critical bugs fixed
* [ ] All screens mobile-optimized
* [ ] Accessibility pass completed
* [ ] Final security check passed
* [ ] App looks clean and stable across devices

<br>
<br>

##**Phase 18 — AI Polish, Vector Search & Gemini Output Refinement**
🗓️ **Date:** June 18, 2025
🎯 **Goal:** Upgrade the intelligence of Thinkback.ai by improving search relevance, refining Gemini prompts, and adding vector-based similarity to match saved content more meaningfully.

---

### 🧠 Step 1 — Upgrade Gemini Prompts for Clarity & Consistency

#### 🔎 classification\_agent

* [ ] Rework prompt to ensure:

  * Consistent JSON format
  * Well-separated `main_tag`, `tags`, `summary`, `mood`, `topic`
* [ ] Add instructions like:

  > “Only respond in JSON. Do not include explanation or preambles.”

#### 😶‍🌫️ nlp\_agent

* [ ] Make prompts smarter:

  * Ask for 3 *emotional signals* and 3 *keywords*
  * Add fallback/default keywords if Gemini fails
* [ ] Cache Gemini results if the same emotional query is repeated (e.g. via Redis or in-memory)

<br>

### 🧠 Step 2 — Add Vector Search to search\_agent

#### Why?

* Keyword search is fragile.
* Emotional queries and fuzzy matches need semantic similarity.

#### Option A — Use Firestore + Gemini embeddings (simpler)

* [ ] Enable embedding via Gemini (or use `text-embedding-004` from Vertex AI)
* [ ] On each save:

  * Call Gemini: “Generate 384-d vector for this content”
  * Store vector as an array under the entry

```json
"embedding": [0.134, -0.283, ..., 0.009]
```

* [ ] On query:

  * Generate vector from user query
  * Compute cosine similarity with all stored vectors
  * Return top N matches

#### Option B — Use Pinecone or Weaviate (more scalable, optional)

* [ ] Sign up for [Pinecone](https://www.pinecone.io/)
* [ ] Store content vectors there instead of Firestore
* [ ] Query for semantic matches with:

```python
pinecone.query(
  vector=embedding,
  top_k=5,
  namespace=user_id
)
```

<br>

### 🧠 Step 3 — Refactor search\_agent to Support Fallback Search

In `search_agent.py`:

* [ ] Try vector match first
* [ ] If no strong match, fallback to:

  * Gemini keyword match
  * Then naive tag match
* [ ] Always return a `confidence` score for results
* [ ] Log what strategy was used for debugging

<br>

### 🧪 Step 4 — Add Search Relevance Feedback Loop

* [ ] On frontend, show 👍 or 👎 buttons on search results
* [ ] On feedback:

  * Store in Firestore under `feedback/`
  * Use later for improving ranking or training embeddings

<br>

### ✅ Deliverables for June 18

* [ ] Gemini prompts updated (consistent, reliable output)
* [ ] Vector embeddings added to each entry
* [ ] Semantic search via cosine similarity
* [ ] Fallback search strategy with logs
* [ ] Optional: Pinecone or vector DB support
* [ ] User can give feedback on search result quality

<br>
<br>

## **Phase 17 — Final UI Polish, Animations, and Delight Features**
🗓️ **Date:** June 19, 2025
🎯 **Goal:** Make Thinkback.ai visually stunning, emotionally resonant, and user-delightful. We’re talking transitions, microinteractions, empty states, and UI features that *feel alive*.

---

### 🎨 Step 1 — Global UI Polish

* [ ] Review every screen (`/save`, `/dashboard`, `/chat`, `/timeline`, `/journal`)
* [ ] Ensure:

  * Padding & spacing is consistent across all viewports
  * Typography hierarchy is logical and clean
  * Color contrast is WCAG accessible (use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/))
  * Mobile responsiveness is solid
* [ ] Use **ShadCN** or **Radix UI** components where helpful

<br>

### 🌀 Step 2 — Page & Component Transitions

Use `framer-motion` for smooth animations:

```bash
npm install framer-motion
```

#### Add animations to:

* [ ] Page transitions (fade-in, slide-up)
* [ ] Card components (fade + subtle zoom)
* [ ] Button presses (tap ripple or scale)
* [ ] Chat messages (slide in, bounce for bot reply)

<br>

### 🧘 Step 3 — Microinteractions That Matter

Small delightful touches:

* [ ] Typing animation for AI chat replies (`useTypewriter` or `react-simple-typewriter`)
* [ ] "Saved successfully" toast with subtle sound/vibration (on mobile)
* [ ] Motivational loading messages:

  * "Looking through your digital memory..."
  * "Past you left this for future you 👀"
* [ ] Use emojis with purpose (🌱 for journal, ⚡ for energy, 🧠 for mindset)

<br>

### 🔄 Step 4 — Improve Empty & Edge States

* [ ] If no saved content:

  > “No entries yet — your second brain is waiting 🧠✨”
* [ ] If chat yields nothing:

  > “Nothing matched. Want to save something new instead?”
* [ ] If journal is empty:

  > “Start with a thought. We’ll help you make sense of it.”

<br>

### 💾 Step 5 — Final Loading States & Error Handling

* [ ] Add skeleton loaders for each screen
* [ ] Handle:

  * Offline state
  * Token expiry / auth errors
  * Gemini API failure fallback:

    > "Our AI is recharging... try again in a few seconds."

<br>

### ✅ Deliverables for June 19

* [ ] All major screens responsive and pixel-perfect
* [ ] Smooth transitions between pages and key components
* [ ] Empty states, loading states, and error messaging added
* [ ] Animations and microinteractions working in `/chat`, `/timeline`, and `/journal`
* [ ] App feels cohesive, beautiful, and joyful

<br>
<br>

## **Phase 18 — Demo, Blog, and Submission Content Prep**
🗓️ **Date:** June 20, 2025
🎯 **Goal:** Create a winning Devpost submission with a killer demo, polished blog, and tight story. You built the system — now sell the vision.

---

### 🎬 Step 1 — Record the Final Demo

#### Tools:

* **Screen Studio** (cleanest)
* **Loom**
* **OBS Studio**

#### Script:

1. **Hook** (5s):
   “This is Thinkback.ai — your memory for the internet.”

2. **Problem** (15s):
   “We save content but forget to come back to it. Thinkback captures what matters and resurfaces it when you need it most.”

3. **Demo** (60s max):

   * Save a video or link → show classification
   * Use chat: “I feel burnt out” → get past media
   * Show journal entry → get reflective insight
   * Show smart feed/timeline in action

4. **Vision** (10s):
   “It’s a second brain built on real emotional context — not just storage, but retrieval.”

5. **Outro**:
   “Built in 3 weeks with Google Cloud, Gemini AI, and ADK.”

✅ Keep total video under **2–3 minutes**
✅ Export at 1080p
✅ Upload to YouTube (unlisted) or Loom with a public link

<br>

### 📝 Step 2 — Finalize Blog Post (Bonus Points)

Title: **“Building an Emotionally-Aware AI Memory System with Google ADK”**

#### Outline:

* [ ] Intro: Problem we’re solving (digital memory fatigue)
* [ ] Core Idea: Save once → retrieve when emotionally needed
* [ ] Architecture: Agents, Google Cloud, Gemini
* [ ] Agent Flow Diagram + how ADK enabled it
* [ ] Technical challenges
* [ ] Lessons learned: Building with agents, focusing on user emotion
* [ ] Screenshots + link to live demo

✅ Publish on Dev.to / Hashnode / Medium
✅ Add hashtag `#adkhackathon`

<br>

### 🌐 Step 3 — Finalize Devpost Submission

Fields to complete:

* [ ] Title: **Thinkback.ai – Your Emotional Memory System**
* [ ] Tagline: “Save once. Retrieve when it matters.”
* [ ] Elevator Pitch (2–3 sentences)
* [ ] Demo video link
* [ ] GitHub repo link
* [ ] Blog link
* [ ] Tools used: Google Cloud, Gemini, Firebase, ADK, FastAPI, Next.js
* [ ] Region: **North America**
* [ ] Challenge tracks entered: Pick based on strongest match (e.g. “Best use of ADK for productivity”)

<br>

### 🧠 Step 4 — Prep for Judge Questions

* What makes your project unique?
* How is AI used in a meaningful way?
* How did you use Google’s ADK?
* What was the hardest problem you solved?

Write down **2–3 bullet answers** for each and keep them handy.

<br>

### ✅ Deliverables for June 20

* [ ] Final 2–3 min demo video recorded + uploaded
* [ ] Blog post published with strong narrative and visuals
* [ ] Devpost project page fully filled out
* [ ] Backup copies of all media in `submission/` folder
* [ ] You’re mentally prepped for Q\&A

<br>
<br>

## **🧠 Phase 19 — Community Push + Backup Strategy + Optional Polish (June 21)**
🎯 *Goal: Let the world know, protect your work, and give it final polish before bug day.*

---

#### 📣 1. Community Awareness & Marketing

Make people *aware* of what you’ve built before you submit:

##### 🔗 Post on Social Media

* [ ] **LinkedIn**: Make a post about your journey:

  * “Built an AI-powered memory system with multi-agent Gemini & Firebase. Save media → talk to it → get motivation when you need it.”
  * Attach a short demo clip (GIF or 20s video)
  * Use hashtags: `#Hackathon #AI #GoogleCloud #Devpost #ThinkbackAI`
* [ ] **Twitter/X**: Short tweet + thread
* [ ] **Discord**: Drop a link in relevant hackathon channels and AI communities

##### 🧪 Optional: HackerNews or Reddit

* [ ] Post a “Show HN” or /r/SideProject submission linking the demo

<br>

#### 💾 2. Backup and Archival

Protect all your work **in case anything breaks** tomorrow or during submission.

##### 🔐 GitHub

* [ ] Push latest code to both `main` and `dev` branches
* [ ] Create a GitHub **release** (e.g. `v1.0-hackathon`)

##### 📦 ZIP Backups

* [ ] Zip entire repo and store in:

  * [ ] Google Drive
  * [ ] Local USB
  * [ ] Optional: Dropbox or iCloud

##### 📝 Save Blog Draft

* [ ] Save your blog post as PDF and plain `.md`
* [ ] Screenshot your Devpost submission and save a backup

<br>

#### 🎨 3. Optional UI Polish

Nice-to-haves (only do if everything else is solid):

* [ ] Smooth fade-in animations for:

  * Journal entries
  * Smart feed items
  * Chat messages
* [ ] Shimmer loading placeholders (e.g., skeleton loaders)
* [ ] Confetti or micro-animation on first content save
* [ ] “Built with Gemini AI” badge in footer or sidebar
* [ ] Update favicon and site title

<br>

#### ✅ Deliverables by End of Day (June 21)

* [ ] At least 1 post on LinkedIn and/or Twitter
* [ ] Blog and Devpost descriptions backed up
* [ ] Full project ZIP saved to 2–3 places
* [ ] UI feels clean, sharp, and final
* [ ] GitHub has a `v1.0` tagged release

<br>
<br>

## **🪲 Phase 20 — Bug Day + Full Runthroughs (June 22)**
🎯 *Goal: Identify and fix every bug, broken flow, or confusing experience before the final submission.*

---

#### 🧪 1. Manual Full App Walkthrough (3–5x)

Act like a new user and walk through every single flow. Do this **multiple times**.

##### 🔁 Test These User Paths:

* [ ] **New user onboarding** → login with Google → redirected to dashboard
* [ ] **Saving content** → paste URL or text → content is classified → appears in dashboard + timeline
* [ ] **Chat with AI**:

  * "I saved a video about discipline" → direct search
  * "I feel stuck and unmotivated" → emotional path → suggestions from past
* [ ] **Smart feed** shows past resurfaced entries
* [ ] **Timeline scrolls and filters correctly**
* [ ] **Journal entry written** → saved → can be retrieved
* [ ] **Reflective AI response** appears after journaling
* [ ] **Logout** → data is preserved
* [ ] Mobile/responsive layout still usable

<br>

#### 🔍 2. Bug Hunt

Create a file `bugs.md` in `/docs/` with all bugs you find.

Categories:

* [ ] ❌ **Frontend**: layout issues, responsiveness, broken states
* [ ] ❌ **Backend**: failed agent calls, bad responses, missing context
* [ ] ❌ **Auth**: broken token logic, user isolation errors
* [ ] ❌ **Firestore**: entries missing or saved incorrectly
* [ ] ❌ **Smart Feed**: irrelevant or missing resurfaced content
* [ ] ❌ **Chat**: poor responses, no fallback, broken intents
* [ ] ❌ **Performance**: pages slow, render lags, chat delay
* [ ] ❌ **AI**: Gemini prompts returning junk or misclassifications

<br>

#### 🔧 3. Fix Bugs & Add Fallbacks

* [ ] Add `try/catch` or error handlers to **every API call**
* [ ] Gracefully handle empty states
* [ ] Validate all Firestore writes (e.g. no undefined fields)
* [ ] Add loading states (spinners, skeletons) to avoid blank screens
* [ ] Add fallback Gemini responses like:

  * “I didn’t quite get that. Want to rephrase or try saving more content?”

<br>

#### 🧪 4. Cross-Browser & Device Testing

Test on:

* [ ] Chrome desktop
* [ ] Safari or Firefox
* [ ] Android or iOS
* [ ] Narrow screen (responsive)
* [ ] Slow network (use dev tools to simulate)

<br>

#### ✅ Deliverables by End of Day (June 22)

* [ ] `bugs.md` has a complete list of issues found and fixed
* [ ] All major flows tested 3–5x
* [ ] No crashes, dead ends, or broken interactions
* [ ] UI polish applied where needed
* [ ] Confidence is high: you're 100% ready for submission

<br>
<br>

## **🚀 Phase 21 — Final Submission Day (June 23, 2025)**
🎯 *Goal: Submit Thinkback.ai to the Google ADK Hackathon in peak condition, with a polished demo, perfect documentation, and zero last-minute errors.*

---

#### ✅ 1. Final App Walkthrough (as a Judge)

Do *one final* clean end-to-end walkthrough while imagining you're a hackathon judge:

* [ ] Can you sign in with Google and start using the product in under 30 seconds?
* [ ] Is the **core value prop** clear just from the dashboard + chat?
* [ ] Is the AI retrieval **relevant**, **personal**, and **non-hardcoded**?
* [ ] Are timelines and resurfacing **visually impressive**?
* [ ] Does the journal feel **emotional**, **useful**, and **AI-enhanced**?
* [ ] Would a judge say: *"Whoa. This is actually smart."*

<br>

#### 📹 2. Record Demo Video

* [ ] Use OBS Studio, Screen Studio, or Loom

* [ ] Keep it **under 3 minutes**, clear voiceover, no stutters

* [ ] Cover:

  * 🧠 Problem: Overwhelmed minds, forgotten content
  * 💡 Solution: Thinkback.ai — AI-powered memory for saved content & thoughts
  * 💬 Demo: Show save, retrieve, chat, journal, timeline, and smart feed
  * 🔁 Agents: Explain briefly how agents work (optional overlay or comment)

* [ ] Upload to YouTube, Loom, or unlisted link

* [ ] Add to your Devpost submission

<br>

#### 🧾 3. Final Devpost Checklist

Go to your [Devpost submission page](https://googlecloudmultiagents.devpost.com/) and confirm:

##### 📄 Basic Info

* [ ] Title: **Thinkback.ai – Your AI-Powered Memory**
* [ ] Tagline: “Save what matters. Recall what heals.”

##### 📂 Project Details

* [ ] 1-paragraph overview
* [ ] Full description with:

  * Problem
  * Solution
  * Features
  * Tech stack
  * How Google ADK + Cloud were used
* [ ] Add GitHub link (make repo public!)
* [ ] Add demo video link
* [ ] Add blog post (if done)

##### 🧠 Technical Highlights

* [ ] Mention: **ADK, Gemini Pro, Firestore, FastAPI, Next.js, Tailwind, Firebase Auth**
* [ ] Explain multi-agent architecture
* [ ] Attach architecture diagram
* [ ] Attach agent interaction diagram

##### 🏆 Bonus Content

* [ ] Blog post (with hashtag #adkhackathon)
* [ ] Open source contribution (PRs or issues to ADK repo)
* [ ] Region: **North America**

<br>

#### 📂 4. GitHub Repo Polish

* [ ] Final `README.md` includes:

  * 1-paragraph summary
  * Screenshots or GIFs
  * Setup instructions
  * Tech stack
  * Demo link
  * Blog link
  * Agent descriptions (1 sentence each)
  * Credits

* [ ] All code pushed to `main` or `release` branch

* [ ] `.env.example` and `.gitignore` included

* [ ] Remove ALL API keys and secrets

* [ ] MIT License included (optional)

<br>

#### 🧠 5. Lock It In

* [ ] Final app deployed and working
* [ ] Final backup created (zip + Google Drive + GitHub)
* [ ] Screenshots saved of all major features
* [ ] Blog saved as PDF just in case

<br>

#### ✅ Deliverables for June 23

* [ ] Final project is submitted on Devpost
* [ ] Demo video recorded and uploaded
* [ ] GitHub repo polished and clean
* [ ] All diagrams, docs, and bonus points submitted
* [ ] You’re officially DONE. 🎉

<br>

💡 *Optional: Celebrate with a post on X, LinkedIn, or Dev.to sharing what you built.*
Let me know if you want a social post template.
