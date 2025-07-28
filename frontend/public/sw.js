// Service Worker for Thinkback
const CACHE_NAME = 'thinkback-v1';
const urlsToCache = [
  '/',
  '/save',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Handle share target
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST' && event.request.url.includes('/save')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const title = formData.get('title') || '';
          const text = formData.get('text') || '';
          const url = formData.get('url') || '';
          
          console.log('Share target POST received:', { title, text, url });
          
          // Store the shared data temporarily
          const sharedData = { title, text, url, timestamp: Date.now() };
          
          // Store in localStorage for the app to access
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('sharedContent', JSON.stringify(sharedData));
          }
          
          // Redirect to the save page with the data as URL parameters
          const searchParams = new URLSearchParams();
          if (title) searchParams.append('title', title);
          if (text) searchParams.append('text', text);
          if (url) searchParams.append('url', url);
          
          return Response.redirect(`/save?${searchParams.toString()}`, 303);
        } catch (error) {
          console.error('Error handling share target:', error);
          // Fallback: redirect to save page
          return Response.redirect('/save', 303);
        }
      })()
    );
  }
});

// Handle app install
self.addEventListener('beforeinstallprompt', (event) => {
  // Store the event so it can be triggered later
  event.preventDefault();
  self.deferredPrompt = event;
}); 