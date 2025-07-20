// Empty service worker to prevent 404 errors
self.addEventListener('install', () => {
  // Skip waiting
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  // Take control immediately
  self.clients.claim();
});