## **YouTube Shorts @mention-to-save: Full Plan**

### **1. User Flow**
- User finds a YouTube Short they want to save.
- User comments on the Short and tags your channel: “@thinkback_ai”.
- Your system detects the mention, extracts the relevant data, matches the user, and saves the Short to their Thinkback vault.

---

### **2. Technical Steps**

#### **A. Detection: Monitor for @thinkback_ai Mentions**
- Use the YouTube Data API (or a scraper if API is insufficient) to monitor new comments on Shorts.
- Filter for comments that mention “@thinkback_ai”.

#### **B. Data Extraction**
- For each detected mention, extract:
  - `platform`: "youtube"
  - `username`: the YouTube username of the commenter
  - `content_url`: the URL of the Short
  - `comment`: the comment text
  - `timestamp`: when the comment was posted

#### **C. Backend API Integration**
- POST this data to your backend `/api/mentions` endpoint.

#### **D. User Matching**
- Backend looks up the YouTube username in the `social_identity_links` table.
- If matched, proceed; if not, queue for user confirmation.

#### **E. Content Scraping & Enrichment**
- Scrape the Short’s metadata (title, description, etc.).
- Run AI enrichment (summary, tags, category).
- Save to the user’s vault.

#### **F. Frontend Update**
- Entry appears in the user’s dashboard as if they had saved it manually.

---

## **3. Implementation Steps**

### **Step 1: Set Up YouTube Comment Monitoring**

#### **Option A: YouTube Data API**
- Use the [YouTube Data API v3](https://developers.google.com/youtube/v3/docs/commentThreads/list) to:
  - List comments on your channel’s videos (including Shorts).
  - Filter for comments containing “@thinkback_ai”.

#### **Option B: Scraper (if API is limited)**
- Use Puppeteer/Playwright or a third-party library to scrape comments for mentions.

---

### **Step 2: POST to Backend**

- For each detected mention, send:
  ```json
  {
    "platform": "youtube",
    "username": "YouTubeUser123",
    "content_url": "https://youtube.com/shorts/abc123",
    "comment": "Check this out! @thinkback_ai",
    "timestamp": "2024-07-25T12:34:56Z"
  }
  ```

---

### **Step 3: Backend Processing**

- `/api/mentions` endpoint:
  1. Looks up the YouTube username in `social_identity_links`.
  2. If matched, scrapes/enriches/saves the Short to the user’s vault.
  3. If not matched, queues for user confirmation.

---

### **Step 4: User Experience**

- User sees the saved Short in their Thinkback dashboard, fully enriched.

---

## **What’s the first thing to do?**

**Step 1: Set up YouTube comment monitoring for @thinkback_ai mentions.**

- Register for the YouTube Data API and get credentials.
- Write a script (Node.js, Python, etc.) that:
  - Lists recent comments on your channel’s Shorts.
  - Filters for comments containing “@thinkback_ai”.
  - Extracts the required data.
  - POSTs to your backend.

---

**Would you like me to generate the code for the YouTube comment monitoring script (using the YouTube Data API) as the first step?**
Or do you want to start with the backend endpoint/schema?
Let me know your preference!
