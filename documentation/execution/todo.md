### things i need to do:


- buy cursor subscription ($46.54/month)
- buy thinkback.ai domain ($134.62/year)
- set up sendgrid
- fix github thinkback logo in github authentication
- github login issues
- email login issues
- fix thinkback name in google authentication
- make help button better/have it lead to a youtube demo


- fix instagram pipeline
- make linkedin pipeline
- make running on localhost work again
- youtube saving cookie thing 


### youtube cookie stuff
1. start: 12:27, end: VOID
2. start 12:47, end: VOID
3. start: 1:06, end: <1:20


ok so right now our youtube saving pipeline relies on yt-dlp to conduct the scraping. this is fine if we want to run this app locally but when we run the backend on cloud run, yt-dlp uses the cloud run IP address and youtube has that flagged to prevent scraping bots and stuff. to circumvent this, yt-dlp requires me to provide valid cookies so that it can prove i am not a bot. this is a very very risky workflow as the yt-dlp relies fully on the cookies and the cookies can expire at anytime, requiring me to refresh them manually. right now I am trying to re-enable my ability to run the app on localhost so that I can implement a new pipeline that chatgpt recommended to me where I use transcript-api + youtube oEmbed + fallback yt-dlp. I will implement this workflow on local then I will push it to the deployes version at guacamole.thinkback.ca and then we will go from there. in sha Allah it works.