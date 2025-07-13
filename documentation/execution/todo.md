### things i need to do:


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