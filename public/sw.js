const CACHE_NAME = "kidquest-champions-v1.0.0";
const CACHE_STATIC_NAME = "kidquest-static-v1.0.0";
const CACHE_DYNAMIC_NAME = "kidquest-dynamic-v1.0.0";

// Static assets to cache on install
const STATIC_CACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/offline.html", // We'll create this fallback page
  // Add other critical static assets
];

// Dynamic cache patterns
const CACHE_PATTERNS = {
  images: /\.(png|jpg|jpeg|svg|gif|webp)$/,
  fonts: /\.(woff|woff2|ttf|eot)$/,
  api: /\/api\//,
  firebase: /firebaseapp\.com|firestore\.googleapis\.com/,
};

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");

  event.waitUntil(
    caches
      .open(CACHE_STATIC_NAME)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log("[SW] Static assets cached successfully");
        return self.skipWaiting(); // Force activation
      })
      .catch((error) => {
        console.error("[SW] Failed to cache static assets:", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_STATIC_NAME &&
              cacheName !== CACHE_DYNAMIC_NAME &&
              cacheName.startsWith("kidquest-")
            ) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("[SW] Service worker activated");
        return self.clients.claim(); // Take control of all pages
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === "chrome-extension:") {
    return;
  }

  event.respondWith(handleFetchRequest(request));
});

async function handleFetchRequest(request) {
  const url = new URL(request.url);

  try {
    // Strategy 1: Network First for API calls and Firebase
    if (
      CACHE_PATTERNS.api.test(url.pathname) ||
      CACHE_PATTERNS.firebase.test(url.hostname)
    ) {
      return await networkFirstStrategy(request);
    }

    // Strategy 2: Cache First for images and fonts
    if (
      CACHE_PATTERNS.images.test(url.pathname) ||
      CACHE_PATTERNS.fonts.test(url.pathname)
    ) {
      return await cacheFirstStrategy(request);
    }

    // Strategy 3: Network First with fallback for app pages
    if (url.origin === self.location.origin) {
      return await appShellStrategy(request);
    }

    // Default: Network only for external resources
    return await fetch(request);
  } catch (error) {
    console.error("[SW] Fetch failed:", error);
    return await getOfflineFallback(request);
  }
}

// Network First Strategy (for API and dynamic content)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_DYNAMIC_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log("[SW] Serving from cache (network failed):", request.url);
      return cachedResponse;
    }
    throw error;
  }
}

// Cache First Strategy (for static assets)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Optionally update cache in background
    fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_DYNAMIC_NAME);
          cache.put(request, networkResponse);
        }
      })
      .catch(() => {});

    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open(CACHE_DYNAMIC_NAME);
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// App Shell Strategy (for app navigation)
async function appShellStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_DYNAMIC_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to app shell
    const appShellResponse = await caches.match("/");
    if (appShellResponse) {
      return appShellResponse;
    }

    throw error;
  }
}

// Offline fallback
async function getOfflineFallback(request) {
  if (request.destination === "document") {
    const offlinePage = await caches.match("/offline.html");
    if (offlinePage) {
      return offlinePage;
    }
  }

  // Return a basic offline response
  return new Response("Offline", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

// Push notification event
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received");

  const options = {
    body: "New adventure awaits in KidQuest Champions!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [200, 100, 200],
    data: {
      url: "/",
    },
    actions: [
      {
        action: "open",
        title: "Open App",
        icon: "/icons/icon-96x96.png",
      },
      {
        action: "close",
        title: "Dismiss",
      },
    ],
  };

  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.body || options.body;
      options.data.url = data.url || options.data.url;
    } catch (error) {
      console.error("[SW] Failed to parse push data:", error);
    }
  }

  event.waitUntil(
    self.registration.showNotification("KidQuest Champions", options)
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked");

  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      // Check if app is already open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }

      // Open new window if app is not open
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync event (for offline actions)
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag);

  if (event.tag === "sync-user-progress") {
    event.waitUntil(syncUserProgress());
  }
});

async function syncUserProgress() {
  try {
    // Get stored offline actions from IndexedDB or localStorage
    // This would sync user progress made while offline
    console.log("[SW] Syncing user progress...");

    // Implementation would depend on your offline storage strategy
    // For now, we'll just log that sync is happening
  } catch (error) {
    console.error("[SW] Failed to sync user progress:", error);
  }
}

// Message event (for communication with main thread)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_CACHE_STATUS") {
    event.ports[0].postMessage({
      cached: true,
      version: CACHE_NAME,
    });
  }
});

console.log("[SW] Service worker script loaded");
