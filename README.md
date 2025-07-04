```
1. Clone repo
2. cd root directory and npm install and run `npm run dev`
3. cd ./server and run `npm install && npm run dev`

Express server will be listening on port 8000.
React app will be running on port 5173
```

🦋 Similar-Origin Window Agent Communication — React Demo

This project demonstrates Same-Origin Agent communication between a parent React app and an iframe-rendered form.

It explores:

✅ Using createPortal() to render React components inside iframe

✅ Sharing and controlling state between parent and iframe

✅ Logging focus/blur/change events across realms

✅ Inspecting and proving that objects across realms are distinct

✅ Contrasting Same-Origin vs Cross-Origin iframe access

🔍 Concepts Used

🔥 Similar-Origin Window Agent

A group of windows/iframes in the same browser tab that share the same origin — allowing them to synchronously access each other’s JavaScript and DOM without postMessage.

🧪 Realm Isolation

Even though the parent and iframe share the same agent, their global objects (Array, Object, etc.) are from different realms. This is visible in the identity check panel:

`window.Array === iframe.contentWindow.Array` // false
🚫 Cross-Origin Restriction

When loaded from a different origin (e.g., localhost:4000), the parent cannot access iframe.contentWindow.document, and must fall back to postMessage().

🏗️ Features

Real-time form monitoring

Developer-mode overlay and logger

Synchronous DOM mutation

Realm identity inspector

Cross-origin simulation toggle
