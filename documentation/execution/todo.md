### things i need to do:
- 180725 - 200725:
    - fix youtube channel names
    - implement simple saving failure fallback
    - bug reporting system
    - inserting consecutive entries
    - disable light mode
    - RELEASE TO PUBLIC (message 10-15 people from waitlist with access)
    - make message template to send to people who were messaged
    - follow up with people who were messaged 
- CONSTANT STARTING 210725:
    - implement fixes suggested by users
    - start on release two, three, ... features + updates on social media everytime something new is added
    - always have min. 1 list of features to have for future releases
    - keep marketing + solidify marketing strategy
    - post on short-form platforms (TikTok, Instagram, YouTube, 4x per week)
- CONSTANT EVERY WEEK STARTING 210725:
    - make list of things to show in demo
    - record demo using a good demo recording software
    - update landing page




- phase zero (160725 - 170725):
    - Optimize SEO metadata (title, description, Open Graph image)
    - Create/clean up bios on:
        - LinkedIn
        - X (Twitter)
        - Reddit
        - Instagram
        - TikTok
        - YouTube
    - List out target subreddits and LinkedIn groups
    - pre-launch post on text socails
        - reddit
    - Record 30-sec MVP demo video from localhost
    - Embed demo video on landing page

- phase one (170725 - 180725):
    - fix all saving workflows
    - linkedin saving pipeline
    - fix authentication
    - Ensure YouTube channel names are attributed properly
    - Add fallback for save failures
    - Implement a basic bug reporting system (maybe voice notes, Tally link, form, or modal)
    - Fix consecutive entry overwrite issue
    - Disable light mode
    - Launch

- phase two ()
    - Implement most common user feedback from bug reporting
    - plan release 3
    - Prioritize quick wins and viral features (e.g. auto surfacing reminders)
    - Design upgrade flow (limit saves for free users)

### Market
- [ ] Keep posting 1x/day on social platforms
- [ ] Reuse winning posts in multiple formats
- [ ] Start short-form content (4x/week):
  - [ ] TikTok
  - [ ] IG Reels
  - [ ] YouTube Shorts

### Monetize
- [ ] Create Stripe account + test flow
- [ ] Add simple pricing page (Free + Pro)
- [ ] Add upgrade prompt inside vault or save screen
- [ ] Launch “Pro” with soft CTA to waitlist/testers

---

# 🔁 DAILY LOOP (STARTING JUL 17)

- [ ] Post 1x per day on all text-based platforms (X, LinkedIn, Reddit)
- [ ] Use demo screenshots + short clips to tease MVP
- [ ] Monitor feedback/comments/DMs and reply
- [ ] Track traffic, signups, and issues in one doc
- [ ] Fix 1 small bug OR polish something in the app
- [ ] Share a dev update, user insight, or “what I shipped today”
- [ ] Update waitlist count and note key blockers

---

# 🔁 WEEKLY LOOP (STARTING JUL 21)

- [ ] Record a new demo or UI walkthrough video
- [ ] Post full product update with:
  - [ ] What’s new
  - [ ] What’s next
  - [ ] Fixes shipped
- [ ] Update landing page with new:
  - [ ] Screenshots or demo
  - [ ] Testimonials (if any)
  - [ ] Waitlist progress
- [ ] Email waitlist or early users with progress update
- [ ] Review analytics: traffic, posts, conversion, DMs
- [ ] Update your public roadmap or “what’s next” tweet/post
- [ ] Reflect for 10 minutes: What worked? What didn’t? What’s the next needle-mover?














- buy cursor subscription ($46.54/month)
- buy thinkback.ai domain ($134.62/year)
- allow people to have other (allowed) contacts send them and save content to their library

### Working Alhamdulilah:
- youtube shorts 
- youtube videos
- reddit post
- x posts (but the title is not passing through)

### Not Working Alhamdulilah
- TikToks
- instagram posts
- instagram reels
- linkedin posts
- linkedin jobs


### youtube cookie stuff
1. start: 12:27, end: VOID
2. start 12:47, end: VOID
3. start: 1:06, end: <1:20


ok so right now our youtube saving pipeline relies on yt-dlp to conduct the scraping. this is fine if we want to run this app locally but when we run the backend on cloud run, yt-dlp uses the cloud run IP address and youtube has that flagged to prevent scraping bots and stuff. to circumvent this, yt-dlp requires me to provide valid cookies so that it can prove i am not a bot. this is a very very risky workflow as the yt-dlp relies fully on the cookies and the cookies can expire at anytime, requiring me to refresh them manually. right now I am trying to re-enable my ability to run the app on localhost so that I can implement a new pipeline that chatgpt recommended to me where I use transcript-api + youtube oEmbed + fallback yt-dlp. I will implement this workflow on local then I will push it to the deployes version at guacamole.thinkback.ca and then we will go from there. in sha Allah it works.