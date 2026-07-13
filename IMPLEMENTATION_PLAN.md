# OptionTrip — Full Implementation Plan
**Last updated:** July 2026  
**Based on:** Live codebase audit  
**Principle:** Extend what exists. Never rewrite working code. Build the missing layer only.

---

## How to read this document

Each task includes:
- **What exists** — so you know what NOT to rewrite
- **What to build** — the specific gap to fill
- **Files to touch** — exact paths in Frontend/src or Backend/src
- **Effort estimate** — realistic hours for a single developer

Phases are ordered by business priority. Complete Phase 1 before touching Phase 3.

---

## Phase 1 — Quick Wins (Days 1–3)

These are high-impact, low-effort fixes. No architecture changes needed.

---

### 1.1 Wire ChatBox.jsx to Trip Generation Backend

**Priority:** CRITICAL — the main homepage CTA does nothing  
**Effort:** 3–4 hours

**What exists:**
- `Frontend/src/components/ChatBox/ChatBox.jsx` — UI is complete, has voice input via Web Speech API, has `handleSubmit` function that only `console.log`s
- `Backend/src/routes/trips.js` → `POST /api/trips/parse-description` already parses NLP text and returns structured trip params
- `TripPlannerForm` already calls `parseTripDescription` — **copy that pattern**

**What to build:**
- In `ChatBox.jsx`, replace the stub `handleSubmit` with a real call to `POST /api/trips/parse-description`
- On success, navigate to `/plan-my-day` with query params OR open the `TripPlannerForm` pre-filled
- Show a loading spinner on the send button during the API call
- Handle empty input gracefully

**Files to touch:**
```
Frontend/src/components/ChatBox/ChatBox.jsx   — wire handleSubmit
```

**Do NOT:**
- Rewrite the ChatBox UI — it already looks good
- Create a new API route — the parse endpoint already exists

---

### 1.2 Fix Meta Description & Page Titles

**Priority:** CRITICAL — production meta says "Travel Tour Booking HTML Templates"  
**Effort:** 2 hours

**What exists:**
- `Frontend/index.html` has a single static `<meta name="description">` for all pages
- No per-route dynamic titles

**What to build:**
- Install `react-helmet-async` (or use the existing package if already in package.json)
- Create `Frontend/src/hooks/usePageMeta.js` — a simple hook that accepts `{ title, description, image }` and renders a `<Helmet>` with og:title, og:description, og:image, twitter:card
- Add `usePageMeta()` to: `Home.jsx`, `Blog.jsx`, `BlogDetail.jsx`, `FlightSearch.jsx`, `HotelSearch.jsx`, `PlanMyDay.jsx`, `MyTripsPage.jsx`
- Fix `index.html` base description to: "OptionTrip — AI-powered travel planning. Describe your dream trip and get a personalized itinerary, flights, and hotels in minutes."

**Files to touch:**
```
Frontend/index.html                               — fix base meta
Frontend/src/hooks/usePageMeta.js                 — NEW: helmet hook
Frontend/src/pages/Home.jsx                       — add usePageMeta
Frontend/src/pages/Blog.jsx                       — add usePageMeta
Frontend/src/pages/BlogDetail/BlogDetail.jsx      — add usePageMeta with post title/excerpt
Frontend/src/pages/FlightSearch.jsx               — add usePageMeta
Frontend/src/pages/HotelSearch.jsx                — add usePageMeta
Frontend/src/pages/PlanMyDay.jsx                  — add usePageMeta
Frontend/src/pages/MyTripsPage/MyTripsPage.jsx    — add usePageMeta
```

---

### 1.3 Add Google Analytics 4

**Priority:** HIGH — currently flying blind on acquisition and conversion  
**Effort:** 2 hours

**What exists:**
- `Frontend/src/services/userActivityService.js` — already tracks user actions to the backend (keep this, it powers Vi's personalisation)
- Travelpayouts affiliate tracking script already in `index.html`

**What to build:**
- Add GA4 measurement ID to `Frontend/.env` as `VITE_GA_MEASUREMENT_ID`
- Add the gtag script to `Frontend/index.html` (loaded conditionally from env)
- Create `Frontend/src/services/analyticsService.js` — thin wrapper around `window.gtag` with functions: `trackSearch(type, query)`, `trackBookingClick(provider, type)`, `trackPageView(path)`, `trackTripGenerated()`, `trackPlanMyDayGenerated()`
- Call these from: `FlightSearch.jsx` (on search + on Book Now click), `HotelSearch.jsx`, `TripPlannerForm.jsx` (on generation), `PlanMyDay.jsx` (on generation)
- Add `<HelmetProvider>` wrapper in `main.jsx` if using react-helmet-async

**Files to touch:**
```
Frontend/index.html                              — add gtag script (env-gated)
Frontend/.env                                    — add VITE_GA_MEASUREMENT_ID
Frontend/src/services/analyticsService.js        — NEW: gtag wrapper
Frontend/src/pages/FlightSearch.jsx              — trackSearch, trackBookingClick
Frontend/src/pages/HotelSearch.jsx               — trackSearch, trackBookingClick
Frontend/src/components/TripPlannerForm/TripPlannerForm.jsx — trackTripGenerated
Frontend/src/pages/PlanMyDay.jsx                 — trackPlanMyDayGenerated
```

---

### 1.4 Remove Dead Code (ChatBot.jsx)

**Priority:** LOW — cleanup only  
**Effort:** 30 minutes

**What exists:**
- `Frontend/src/components/ChatBot/ChatBot.jsx` — hardcoded static reply, not imported anywhere in App.jsx

**What to build:**
- Confirm it is not imported anywhere (`grep -r "ChatBot" Frontend/src`)
- Delete the file if confirmed unused
- If it IS used somewhere, replace the static reply with a redirect to open ViAssistant

---

## Phase 2 — Revenue & Conversion (Week 1–2)

These unlock the ability to measure and improve the booking funnel.

---

### 2.1 Affiliate Click Tracking & Booking Funnel

**Priority:** HIGH — enables revenue measurement without building native checkout  
**Effort:** 4–6 hours

**What exists:**
- `FlightSearch.jsx` has `<a href={bookingUrl} target="_blank">Book Now</a>` for each card type
- `HotelSearch.jsx` has `<a href={hotel.bookingUrl} target="_blank">Book Now</a>`
- Travelpayouts marker 370056 already embedded in flight affiliate URLs
- `Backend/src/models/UserActivity.js` already has a schema — add event type `booking_click`

**What to build — Backend:**
- Add `booking_click` to the `UserActivity` event types enum in `UserActivity.js`
- Add a new event type field: `provider` (string), `booking_type` (flight/hotel/car), `destination` (string), `price` (number)

**What to build — Frontend:**
- In `analyticsService.js` (from 1.3), `trackBookingClick(provider, type, destination, price)` sends to GA4 AND calls `logActivity('booking_click', {...})`
- Wrap each "Book Now" anchor in each FlightCard variant and HotelCard with an `onClick` that calls `trackBookingClick` before the link opens
- This gives a complete funnel: Search → View Results → Click Book → (affiliate conversion on partner site)

**Files to touch:**
```
Backend/src/models/UserActivity.js              — add booking_click event type + fields
Frontend/src/components/FlightCard/FlightCardDuffel.jsx   — add onClick tracking
Frontend/src/components/FlightCard/FlightCardGF.jsx       — add onClick tracking
Frontend/src/components/FlightCard/FlightCardTP.jsx       — add onClick tracking
Frontend/src/components/HotelCard/HotelCard.jsx           — add onClick tracking
Frontend/src/services/analyticsService.js       — add trackBookingClick
```

---

### 2.2 Save Flight/Hotel/Car Selections to Trip Model

**Priority:** HIGH — prerequisite for Unified Trip System  
**Effort:** 6–8 hours

**What exists:**
- `Backend/src/models/Trip.js` — has `options[]` and `dayItinerary[]` but NO flight/hotel/car fields
- `Frontend/src/pages/PlannedTripPage/sections/FlightTab.jsx` — shows live flight search, results discarded
- `Frontend/src/pages/PlannedTripPage/sections/HotelTab.jsx` — shows live hotel search, results discarded
- `Backend/src/routes/trips.js` — has `PUT /api/trips/:tripId/save` to save a trip for a user

**What to build — Backend:**
- In `Trip.js`, add optional fields:
  ```js
  selectedFlight: { provider, bookingUrl, price, currency, departure, arrival, airline, flightNumber }
  selectedHotel:  { provider, bookingUrl, price, currency, name, address, checkIn, checkOut, stars }
  selectedCar:    { provider, bookingUrl, price, currency, carType, pickupLocation }
  totalEstimatedCost: Number
  ```
- Add route: `PATCH /api/trips/:tripId/selection` — updates any combination of selectedFlight/selectedHotel/selectedCar and recalculates totalEstimatedCost
- Auth: `authenticate` middleware (already exists)

**What to build — Frontend:**
- In `FlightTab.jsx`, add a "Select for this trip" button on each flight card (only shown when viewing inside PlannedTripPage)
- On click: call `PATCH /api/trips/:tripId/selection` with the flight data + show confirmation toast
- Same pattern for `HotelTab.jsx`
- In `PlannedTripPage`, show a sticky "Trip Summary" bar at the bottom when selections are made: `Flight ✓ · Hotel ✓ · Est. cost: $1,240`

**Files to touch:**
```
Backend/src/models/Trip.js                                     — add selection fields
Backend/src/routes/trips.js                                    — add PATCH /selection route
Backend/src/controllers/tripController.js                      — add updateSelection handler
Frontend/src/pages/PlannedTripPage/sections/FlightTab.jsx      — add "Select" button
Frontend/src/pages/PlannedTripPage/sections/HotelTab.jsx       — add "Select" button
Frontend/src/pages/PlannedTripPage/PlannedTripPage.jsx         — add trip summary bar
```

---

### 2.3 Trip Management Improvements (Dashboard)

**Priority:** MEDIUM-HIGH — users need basic control over their trips  
**Effort:** 4–5 hours

**What exists:**
- `Frontend/src/pages/MyTripsPage/MyTripsPage.jsx` — shows trip cards, no delete/edit
- `Backend/src/routes/trips.js` — has `GET /api/trips/my-trips` but no DELETE route

**What to build — Backend:**
- Add `DELETE /api/trips/:tripId` route — soft delete (set `deleted: true` flag, don't actually remove)
- Add `PATCH /api/trips/:tripId/rename` route — update trip title/notes only

**What to build — Frontend:**
- In `MyTripsPage`, add a `···` kebab menu on each trip card with: Rename, Delete
- Delete: shows a confirmation modal before calling the API
- Rename: inline edit of the trip title
- Add an empty state for when the user has no trips: illustration + "Start your first trip" CTA button linking to `/plan-my-day`

**Files to touch:**
```
Backend/src/routes/trips.js                    — add DELETE and PATCH /rename routes
Backend/src/controllers/tripController.js      — add deleteTrip, renameTrip handlers
Frontend/src/pages/MyTripsPage/MyTripsPage.jsx — add kebab menu, delete modal, empty state
```

---

## Phase 3 — Platform Completeness (Week 2–3)

---

### 3.1 Dynamic Destination Suggestions (Discovery Mode)

**Priority:** HIGH — "warm beach in May" should return real AI suggestions  
**Effort:** 6–8 hours

**What exists:**
- `Frontend/src/data/exploreDestinations.js` — static file, never changes
- `Backend/src/services/openaiService.js` — already configured with gpt-4o-mini
- `TripPlannerForm` has `parseTripDescription` which parses typed text — extend this pattern

**What to build — Backend:**
- Add `POST /api/trips/suggest-destinations` — accepts `{ query: "warm beach in May", budget: "moderate" }`
- Uses gpt-4o-mini with a prompt: returns an array of 3–5 `{ destination, country, why, bestMonths, imageSearch }` objects as JSON
- Keep prompt output small (max 400 tokens) — cheap call
- Reuse `searchDestinationImage` from `unsplashService.js` to attach a photo to each suggestion

**What to build — Frontend:**
- In `TripPlannerForm`, if the user types a vague query (detected by checking if `parseTripDescription` returns no specific destination), show a "Suggested destinations" dropdown with the AI results
- In `ExploreDestinations.jsx`, add a text input at the top: "Describe the trip you want..." → calls the new endpoint → replaces the static cards with live AI-generated suggestion cards
- Each suggestion card has: destination photo (from Unsplash), destination name, `why` blurb, a "Plan this trip" button that pre-fills TripPlannerForm

**Files to touch:**
```
Backend/src/routes/trips.js                          — add POST /suggest-destinations
Backend/src/controllers/tripController.js            — add suggestDestinations handler
Backend/src/services/openaiService.js                — add suggestDestinations function
Frontend/src/components/ExploreDestinations/ExploreDestinations.jsx — add AI input + live results
Frontend/src/components/TripPlannerForm/TripPlannerForm.jsx          — show AI suggestions on vague input
```

---

### 3.2 Vi Assistant — Streaming Responses

**Priority:** MEDIUM — improves perceived speed, not blocking  
**Effort:** 5–6 hours

**What exists:**
- `Backend/src/routes/chat.js` → `POST /api/chat/message` — returns full response (non-streaming)
- `Frontend/src/components/ViAssistant/ViAssistant.jsx` — displays full message on arrival, STT/TTS fully working
- OpenAI SDK already imported in `chatService.js`

**What to build — Backend:**
- Add a new route `POST /api/chat/message/stream` that uses `stream: true` in the OpenAI call
- Uses `response.pipeThrough` / `TransformStream` to forward SSE chunks to the client
- Keep the existing non-streaming route — don't remove it

**What to build — Frontend:**
- In `ViAssistant.jsx`, switch `fetch('/api/chat/message')` to use the streaming endpoint with `ReadableStream`
- Render the assistant message character-by-character as chunks arrive (append to a `streamingText` state)
- Once stream closes, save the complete message to conversation history as before
- TTS: trigger only after full message is received (same as today)

**Files to touch:**
```
Backend/src/routes/chat.js                            — add POST /message/stream route
Backend/src/services/chatService.js                   — add streamMessage function
Frontend/src/components/ViAssistant/ViAssistant.jsx   — switch to streaming fetch, render chunks
```

---

### 3.3 User Preferences Page

**Priority:** MEDIUM — personalises recommendations over time  
**Effort:** 4–5 hours

**What exists:**
- `Frontend/src/pages/ProfilePage/ProfilePage.jsx` — has name/phone/password/avatar, no travel preferences
- `Backend/src/models/User.js` — check if it has a preferences field; likely not

**What to build — Backend:**
- In `User.js`, add `preferences` subdocument:
  ```js
  preferences: {
    travelStyle: { type: String, enum: ['budget','moderate','luxury','premium'] },
    preferredActivities: [String],  // ['beach','hiking','culture','food']
    seatClass: { type: String, enum: ['economy','premium_economy','business','first'] },
    hotelStars: { type: Number, min: 1, max: 5 },
    dietaryRestrictions: [String],
    accessibility: [String]
  }
  ```
- Add `PATCH /api/auth/preferences` route that updates only the preferences subdocument

**What to build — Frontend:**
- Add a "Travel Preferences" tab to `ProfilePage.jsx` (alongside existing account settings)
- Form: travel style selector (4 options), activity chips (multi-select), seat class, hotel stars, dietary (text tags), accessibility (checkboxes)
- On save: call `PATCH /api/auth/preferences`
- Pass preferences into the TripPlannerForm's AI generation payload so trips are pre-personalised

**Files to touch:**
```
Backend/src/models/User.js                       — add preferences subdocument
Backend/src/routes/authRoutes.js                 — add PATCH /preferences
Backend/src/controllers/authController.js        — add updatePreferences handler
Frontend/src/pages/ProfilePage/ProfilePage.jsx   — add Preferences tab
Frontend/src/components/TripPlannerForm/TripPlannerForm.jsx — read user preferences from AuthContext
```

---

### 3.4 Sitemap & robots.txt

**Priority:** MEDIUM — basic SEO infrastructure  
**Effort:** 2 hours

**What exists:**
- `Frontend/public/` — no sitemap or robots.txt

**What to build:**
- `Frontend/public/robots.txt`:
  ```
  User-agent: *
  Allow: /
  Disallow: /my-trips
  Disallow: /profile
  Disallow: /planned-trip
  Sitemap: https://optiontrip.com/sitemap.xml
  ```
- `Backend/src/routes/seo.js` — express route that serves a dynamic `sitemap.xml`:
  - Static routes: `/`, `/flights`, `/hotels`, `/car-rental`, `/blog`, `/plan-my-day`, `/about`, `/contact`
  - Dynamic: fetches blog post slugs from WordPress API and adds `/blog/:slug` entries
  - Returns XML with `lastmod` and `changefreq` fields
- Register at `app.use('/sitemap.xml', seoRouter)` in `app.js`

**Files to touch:**
```
Frontend/public/robots.txt                — NEW
Backend/src/routes/seo.js                 — NEW: dynamic sitemap
Backend/src/app.js                        — register seo router
```

---

### 3.5 Wishlist / Saved Ideas

**Priority:** MEDIUM — increases return visits  
**Effort:** 4 hours

**What exists:**
- `Backend/src/models/` — has `VisitedLocation.js` for pinning visited places. Use same pattern.
- `MyTripsPage` has three tabs (My Trips, Travel Map, Visited Places) — add a fourth

**What to build — Backend:**
- `Backend/src/models/Wishlist.js` — schema: `userId`, `destinationName`, `country`, `imageUrl`, `notes`, `addedAt`
- `Backend/src/routes/wishlist.js` — `GET /api/wishlist`, `POST /api/wishlist`, `DELETE /api/wishlist/:id`
- Register in `app.js` as `/api/wishlist`

**What to build — Frontend:**
- Add "Wishlist" tab to `MyTripsPage`
- In `TopDestinations.jsx` and `ExploreDestinations.jsx`, add a heart/bookmark icon on each card — clicking adds to wishlist (auth required, shows login prompt if not authed)
- Wishlist tab shows cards with destination name, image, notes, and "Plan this trip" button

**Files to touch:**
```
Backend/src/models/Wishlist.js                    — NEW
Backend/src/routes/wishlist.js                    — NEW
Backend/src/app.js                                — register /api/wishlist
Frontend/src/pages/MyTripsPage/MyTripsPage.jsx    — add Wishlist tab
Frontend/src/components/TopDestinations/TopDestinations.jsx   — add bookmark icon
Frontend/src/components/ExploreDestinations/ExploreDestinations.jsx — add bookmark icon
```

---

## Phase 4 — SEO & Content Integration (Week 3–4)

---

### 4.1 Blog → Destination → Booking Link Chain

**Priority:** MEDIUM — turns organic traffic into bookings  
**Effort:** 5–6 hours

**What exists:**
- `BlogDetail.jsx` — renders full article content
- `FlightSearch.jsx` — accepts `?destination=` query param (check, may already exist)
- `HotelSearch.jsx` — accepts `?destination=` query param

**What to build — Backend:**
- Add `POST /api/blog/extract-destinations` — takes `{ content: string }`, uses gpt-4o-mini to return `{ destinations: ['Paris', 'Lyon'], countries: ['France'] }` (cheap, ~50 tokens output)

**What to build — Frontend:**
- In `BlogDetail.jsx`, after the article loads (and has no WP featured links), call `/api/blog/extract-destinations` with the article content
- Render a "Book this trip" sidebar/strip below the article: detected destinations as chips, each linking to `FlightSearch?destination=Paris` and `HotelSearch?destination=Paris`
- Keep it subtle — a single `<aside>` block below the article body

**Files to touch:**
```
Backend/src/routes/blog.js                        — add POST /extract-destinations
Backend/src/services/blogImageService.js          — add extractDestinations function (reuse OpenAI client)
Frontend/src/pages/BlogDetail/BlogDetail.jsx      — add destination extraction + booking strip
```

---

### 4.2 hreflang Tags for Multilingual SEO

**Priority:** LOW-MEDIUM  
**Effort:** 2 hours

**What exists:**
- `Frontend/src/hooks/useLanguage.js` and `i18n.js` — 20+ languages supported
- `Frontend/src/contexts/LocaleContext.jsx` — tracks current locale

**What to build:**
- In `usePageMeta.js` (from Phase 1.2), add `<link rel="alternate" hreflang="..." href="...">` tags for each supported language
- Map the locale list from `i18n.js` to hreflang codes
- href should be the current URL with `?lang=xx` or the path equivalent

**Files to touch:**
```
Frontend/src/hooks/usePageMeta.js   — add hreflang link tags
```

---

## Phase 5 — Admin Panel (Week 4–5)

Build this after analytics are live so you can actually use the dashboard from day one.

---

### 5.1 Admin Backend Foundation

**Effort:** 6–8 hours

**What exists:**
- `Backend/src/middleware/auth.js` — has `authenticate` middleware for users
- `Backend/src/models/User.js` — likely has a `role` field or needs one added

**What to build — Backend:**
- Add `role: { type: String, enum: ['user','admin'], default: 'user' }` to `User.js` if not present
- Create `Backend/src/middleware/requireAdmin.js` — checks `req.user.role === 'admin'`, returns 403 otherwise
- Create `Backend/src/routes/admin.js` with routes:
  - `GET /api/admin/stats` — user count, trip count, total booking clicks, active users (last 7 days) from UserActivity
  - `GET /api/admin/users?page=&search=` — paginated user list with last active, trip count
  - `GET /api/admin/activity?type=&page=` — paginated UserActivity feed
  - `DELETE /api/admin/users/:id` — deactivate user (set `active: false`)
- Register at `app.use('/api/admin', requireAdmin, adminRouter)` in `app.js`

**Files to touch:**
```
Backend/src/models/User.js               — add role field
Backend/src/middleware/requireAdmin.js   — NEW
Backend/src/routes/admin.js              — NEW
Backend/src/controllers/adminController.js — NEW
Backend/src/app.js                       — register /api/admin
```

---

### 5.2 Admin Frontend (Protected Route)

**Effort:** 8–10 hours

**What exists:**
- `Frontend/src/App.jsx` — has `<Route>` definitions, auth guard pattern already used for `/my-trips`
- `Frontend/src/contexts/AuthContext.jsx` — provides `user` object

**What to build — Frontend:**
- `Frontend/src/pages/AdminPage/AdminPage.jsx` — gated by `user.role === 'admin'`
- Three tabs:
  1. **Stats** — cards showing: total users, total trips, booking clicks this week, top destinations (from UserActivity data)
  2. **Users** — searchable table: name, email, joined date, last active, trip count, deactivate button
  3. **Activity Feed** — filterable by event type, shows recent UserActivity records
- Route: `/admin` — redirect to `/` if user is not admin
- Add to `App.jsx` as a protected route

**Files to touch:**
```
Frontend/src/pages/AdminPage/AdminPage.jsx    — NEW
Frontend/src/App.jsx                          — add /admin route with role guard
Frontend/src/services/adminService.js         — NEW: API calls to /api/admin/*
```

---

## Phase 6 — Unified Trip System Completion (Week 5)

---

### 6.1 Trip Status Flow: draft → saved → confirmed

**Effort:** 3–4 hours

**What exists:**
- `Trip.js` has `status` enum including `'confirmed'` but nothing sets it
- `Backend/src/routes/trips.js` has `POST /api/trips/:tripId/save`

**What to build:**
- When a trip has `selectedFlight` OR `selectedHotel` set (from Phase 2.2), auto-set `status: 'booked_externally'` (add this to the enum)
- This is the honest state: the user clicked through to a partner site — we can't confirm the booking, but we know intent was there
- Add `status: 'booked_externally'` badge to the trip card in `MyTripsPage` — shown as "Booking in progress"
- Add a manual "Mark as booked" button on the PlannedTripPage for users who completed the booking and want to record it

**Files to touch:**
```
Backend/src/models/Trip.js                                  — add 'booked_externally' to status enum
Backend/src/controllers/tripController.js                   — set status on selection save
Frontend/src/pages/MyTripsPage/MyTripsPage.jsx              — add status badge
Frontend/src/pages/PlannedTripPage/PlannedTripPage.jsx      — add "Mark as booked" button
```

---

### 6.2 Total Cost Aggregation

**Effort:** 2 hours

**What exists:**
- `Trip.js` — `selectedFlight.price`, `selectedHotel.price` will be added in Phase 2.2
- `dayItinerary[].activities[].cost` already exists

**What to build:**
- Backend: in `updateSelection` handler (from Phase 2.2), calculate and save `totalEstimatedCost`:
  ```
  totalEstimatedCost = selectedFlight.price + (selectedHotel.price × nights) + sum(activities[].cost)
  ```
- Frontend: in the trip summary bar (Phase 2.2) and in the MyTripsPage card, display `Est. total: $1,240`

**Files to touch:**
```
Backend/src/controllers/tripController.js       — add cost calculation in updateSelection
Frontend/src/pages/PlannedTripPage/PlannedTripPage.jsx — show total in summary bar
Frontend/src/pages/MyTripsPage/MyTripsPage.jsx  — show total on trip card
```

---

## Phase 7 — Community Features (Post-MVP)

Do not start this phase until Phases 1–4 are complete and the platform has active users.

---

### 7.1 Trip Sharing (Public Itinerary Links)

**Effort:** 4–5 hours

**What exists:**
- `PlannedTripPage.jsx` — renders the full itinerary
- `Trip.js` — has a trip ID

**What to build — Backend:**
- Add `shareToken: String` (random UUID) and `isPublic: Boolean` to `Trip.js`
- Add `POST /api/trips/:tripId/share` — generates shareToken, sets isPublic: true, returns share URL
- Add `GET /api/trips/shared/:shareToken` — public route (no auth) that returns trip data

**What to build — Frontend:**
- In `PlannedTripPage`, add a "Share" button — calls the share endpoint, copies the link to clipboard
- Create `Frontend/src/pages/SharedTripPage/SharedTripPage.jsx` — read-only view of a shared trip, accessible at `/trip/shared/:shareToken` without auth
- Add route to `App.jsx`

**Files to touch:**
```
Backend/src/models/Trip.js                               — add shareToken, isPublic
Backend/src/routes/trips.js                              — add share routes
Frontend/src/pages/PlannedTripPage/PlannedTripPage.jsx   — add Share button
Frontend/src/pages/SharedTripPage/SharedTripPage.jsx     — NEW: read-only shared view
Frontend/src/App.jsx                                     — add /trip/shared/:shareToken route
```

---

### 7.2 Destination Reviews

**Effort:** 8–10 hours

**What exists:**
- Blog comment system via WordPress API is already built — use this as a reference for the pattern
- `Backend/src/models/` — create a new Review model

**What to build — Backend:**
- `Backend/src/models/Review.js` — schema: `userId`, `destinationName`, `country`, `rating (1–5)`, `text`, `tripId (optional ref)`, `createdAt`
- `Backend/src/routes/reviews.js` — `GET /api/reviews?destination=Paris`, `POST /api/reviews` (auth), `DELETE /api/reviews/:id` (own review or admin)
- Register in `app.js`

**What to build — Frontend:**
- Add a "Reviews" section at the bottom of `ExploreAnywhereDetailPage.jsx` (if it exists) or create a `DestinationPage`
- Star rating input (1–5) + text area, submit button, paginated review list below

**Files to touch:**
```
Backend/src/models/Review.js               — NEW
Backend/src/routes/reviews.js              — NEW
Backend/src/app.js                         — register /api/reviews
Frontend/src/pages/ExploreAnywhereDetailPage.jsx — add Reviews section
Frontend/src/services/reviewService.js     — NEW: API calls
```

---

## Phase 8 — TripStory & Live Trip Mode (Phase 2, Post-Revenue)

These are Phase 2 features. Do not implement until the platform generates consistent revenue.

---

### 8.1 TripStory

**What to build when ready:**
- `Backend/src/models/TripStory.js` — `tripId`, `entries[]` (text, voiceUrl, imageUrl, location, timestamp)
- `Backend/src/routes/tripStory.js` — CRUD for story entries, voice recording upload via S3/Cloudinary
- Frontend: a story editor on PlannedTripPage, public story view page at `/story/:storyId`

---

### 8.2 Live Trip Mode

**What to build when ready:**
- Activate when `trip.startDate === today`
- Show today's itinerary as the default view
- Push notifications via Web Push API for upcoming activities
- Vi assistant gets `liveMode: true` context flag — it's already built into ViAssistant, just needs to be triggered
- Nearby recommendations using Geolocation API + `POST /api/plan-my-day` (already exists, just pre-populate with current location)

---

## Environment Variables Checklist

Variables to add/confirm in both `Backend/env` and `Frontend/.env`:

**Already present (confirm values):**
```
OPENAI_API_KEY
OPENAI_MODEL (set to gpt-4o-mini)
UNSPLASH_ACCESS_KEY
GOOGLE_PLACES_API_KEY
JWT_ACCESS_SECRET
```

**To add:**
```
# Frontend/.env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Backend/env  
ADMIN_EMAIL=your@email.com    # for seeding initial admin user
```

---

## Dependency Additions

**Frontend:**
```bash
npm install react-helmet-async    # Phase 1.2 — per-route meta tags
```

**Backend:**  
No new dependencies required for any phase above. All work uses existing packages (OpenAI, Express, Mongoose, node fetch).

---

## What NOT to Rebuild

The following are already production-quality — do not rewrite them:

| Component | Status | Note |
|---|---|---|
| ViAssistant.jsx | Complete | STT, TTS, history, trip context all wired |
| TripPlannerForm.jsx | Complete | NLP, voice, Google Places, AI parse |
| PlanMyDay.jsx + backend | Complete | GPS, vibe, AI itinerary, Leaflet maps |
| FlightSearch.jsx | Complete | Multi-source, filters, pagination |
| HotelSearch.jsx | Complete | Booking.com, rooms, photos |
| TravelMapPage.jsx | Complete | Leaflet, markers, polyline, sidebar |
| BlogDetail.jsx | Complete | WP API, hero image, comments, share |
| wordpressApi.js | Complete | Posts, images, smart hero via AI + Unsplash |
| openaiService.js | Complete | Two-phase trip generation |
| unsplashService.js | Complete | Destination image search |
| AuthContext + auth flow | Complete | JWT, OAuth, refresh tokens |
| UserActivity tracking | Complete | First-party analytics backend |

---

*End of implementation plan.*
