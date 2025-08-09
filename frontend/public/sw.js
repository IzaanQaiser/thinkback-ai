// Service Worker for Thinkback
const CACHE_NAME = 'thinkback-v1-' + Date.now(); // Add timestamp for cache busting
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
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

// Single consolidated fetch event handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // CRITICAL: Completely bypass service worker for Firebase auth routes
  if (url.pathname.includes('/__/auth/')) {
    // Let Firebase handle these requests completely without any service worker interference
    console.log('🔧 Service worker bypassing auth route:', url.pathname);
    return;
  }

  // Handle share target POST requests
  if (event.request.method === 'POST' && url.pathname.includes('/save')) {
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
    return;
  }

  // Don't cache HTML files to ensure fresh content
  if (url.pathname.includes('.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Default caching behavior for other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Handle app install
self.addEventListener('beforeinstallprompt', (event) => {
  // Store the event so it can be triggered later
  event.preventDefault();
  self.deferredPrompt = event;
}); 