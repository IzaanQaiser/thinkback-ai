// Service Worker for Thinkback.ai
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
  if (event.request.url.includes('/save') && event.request.method === 'GET') {
    const url = new URL(event.request.url);
    const title = url.searchParams.get('title');
    const text = url.searchParams.get('text');
    const sharedUrl = url.searchParams.get('url');
    
    // If this is a share target request with parameters, handle it
    if (title || text || sharedUrl) {
      console.log('Share target request received:', { title, text, url: sharedUrl });
      
      // For now, just let the request pass through to the save page
      // The save page will handle the URL parameters
    }
  }
});

// Handle app install
self.addEventListener('beforeinstallprompt', (event) => {
  // Store the event so it can be triggered later
  event.preventDefault();
  self.deferredPrompt = event;
}); 