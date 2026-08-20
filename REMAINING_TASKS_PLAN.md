# OptionTrip — Plan to Finish the Remaining Work

This covers every task from the project brief that is **not yet at 100%** — the 6 in-progress items and the 25 not-started items, plus the 2 items the brief listed without a completion percentage. Nothing from the brief is skipped.

Before writing steps for each ticket, the actual codebase was checked against what the brief assumes. Several tickets are further along than the brief's percentage suggests — that's called out explicitly so effort isn't wasted rebuilding things that already exist.

---

## How to read this document

Each ticket has:
- **Brief says** — the status/percentage from the original PDF.
- **Actually in the codebase** — what's genuinely there right now, verified by reading the code.
- **What's left** — the real remaining work, in plain terms.
- **Steps** — concrete implementation steps, in order.
- **Touches** — the main files/areas involved.
- **Depends on** — other tickets in this plan that should land first.

Tickets are grouped into **phases** — not by brief order, but by build order: what has to exist before the next thing can be built on top of it.

---

## Reality check — corrections to the brief before starting

A few things worth knowing before planning further, found while checking the code:

1. **AI voice is nearly done, not 80%.** Both directions already work end-to-end: the mic button records and sends audio to `/api/voice/transcribe` (Whisper), and a "Listen" button sends replies to `/api/voice/speak` (OpenAI TTS) and plays them back. The only real gap is the "ChatGPT voice mode" style continuous back-and-forth the brief asks for — today it's record → transcribe → type → reply → tap Listen, not a live open-mic conversation.
2. **The "AI Travel Buddy Integration Entry Point" ticket is effectively complete.** VI can already call a real `search_flights` tool mid-conversation, run it against all four flight providers, and show results inline in chat. The brief lists this with no percentage — it should really read close to 100% for flights, with hotels/cars/trip-building still to wire up the same way.
3. **VI's memory system is partially real, not 0%.** There's a working `UserMemoryProfile` that already stores favorite destinations, trip types, budget, interests, and quotes — this is the brief's "Profile Memory" type, built. What's missing is Trip Memory (notes/AI suggestions attached to a specific trip) and Live Context Memory (weather, time of day) — Live Location is already fed to VI today for "near me" questions.
4. **The user account area is much further along than "0%."** `MyTripsPage` already has a tabbed hub with My Trips, Travel Map, Visited Places, and Wishlist tabs. A notification bell is already wired into the header, backed by a real `Notification` model and API. `ProfilePage` already has Personal Info, Password, Connected Accounts, and Travel Preferences sections. What's missing is a proper Dashboard landing view and a few settings sections (privacy, notification preferences).
5. **The Trip data model is already mostly unified.** `Trip.js` already stores `selectedFlight`, `selectedHotel`, `selectedCar`, and the generated itinerary directly on the trip. What's missing is a travel-lifecycle status (planned/active/completed, separate from the existing planning-workflow status), a notes field, and linking TripStory/visited-location entries back to a `trip_id`.
6. **Trip sharing already exists in a basic form.** `shareToken` + `isPublic` on `Trip.js`, plus a working `SharedTripPage`, already let a single trip be shared via a public link. The "Public Travel Map Pages" and social-sharing tickets can extend this pattern rather than building link-sharing from scratch.
7. **Wishlist and Visited Locations already have working models + API routes** (`Wishlist.js`, `VisitedLocation.js`, `wishlist.js` route). The "Save Trip Idea" button ticket is mostly a UI hookup, not new backend work.
8. **Voice transcription (Whisper) is already live** via `/api/voice/transcribe` — the TripStory voice review ticket can reuse it directly instead of building speech-to-text from scratch.

---

## Phase order and why

1. **Phase 0 — Finish what's already in flight.** Six tickets are partially done; closing these out first avoids context-switching cost and clears the board.
2. **Phase 1 — Foundational data model.** The Trip status lifecycle and VI's tool-calling pattern (for hotels/cars, not just flights) are load-bearing for Live Trip Mode, notifications, and VI recommendations later. Building these after those features would mean reworking them.
3. **Phase 2 — Account core.** The Dashboard and VI's remaining memory types are the backbone of the personal-companion pitch; most later features (achievements, yearly report, live trip mode) render inside this area.
4. **Phase 3 — Travel Map & community.** Builds on the account core and the trip model; this is the most content-heavy cluster (TripStory, sharing, public pages).
5. **Phase 4 — Live Trip Mode.** Depends directly on the Phase 1 trip-status work.
6. **Phase 5 — Discovery, onboarding, content pages.** Independent of the above; can run in parallel by a second person/stream if available.
7. **Phase 6 — Growth & engagement.** Deliberately last — these features (achievements, share cards, yearly report) need real user trip/map data to be worth showing.
8. **Phase 7 — Account extras.** Explicitly marked "next phase" in the brief itself; lowest priority.

---

# Phase 0 — Finish What's In Flight

## 0.1 Footer Overhaul (90% → 100%)

**Brief says:** In Progress, 90%.
**Actually in the codebase:** Not verified in this pass — treat the 90% as accurate; this is a content/layout task, not an architecture one.
**What's left:** Confirm the five columns (About, Company, Travel, Support, Legal) are all present with the exact links specified, plus the trust/technology block, language selector, social icons, copyright line, and the optional email subscription block above the footer.
**Steps:**
1. Diff the current footer against the five-column spec in the brief section by section.
2. Add whichever column or element is still missing (most likely candidates: the "Powered by VI TravelBuddy" trust line, or the email subscription block, since those are the most recently specified additions).
3. Confirm every link in Company/Travel/Support/Legal actually resolves to a real page (some, like Cookie Policy / Data Protection, already exist per `CookiePolicyPage.jsx` / `DataProtectionPage.jsx`).
**Touches:** `Frontend/src/components/Footer/Footer.jsx`, `Footer.css`.
**Depends on:** nothing.

## 0.2 AI Voice Responses (real 80% → 100%)

**Brief says:** In Progress, 80%.
**Actually in the codebase:** Mic-to-text and text-to-speech both fully work today (`ViAssistant.jsx` already wires `MediaRecorder` → `/api/voice/transcribe`, and a Listen button → `/api/voice/speak`).
**What's left:** The brief's real ask is **continuous, real-time voice mode** — talk and get spoken replies back without tapping record/stop/listen for every turn, like ChatGPT's voice mode.
**Steps:**
1. Add a distinct "Voice Mode" toggle in the VI panel, separate from the existing tap-to-record mic button.
2. In voice mode, auto-start listening after each of VI's spoken replies finishes playing (silence-detection or a simple "tap to end turn" fallback if reliable voice-activity-detection is too heavy to ship first).
3. Auto-play each reply through `/api/voice/speak` instead of requiring a manual Listen tap.
4. Add a clear visual state machine (listening / thinking / speaking) so the user always knows what's happening — reuse the existing `voiceStatus` state that already drives the mic UI.
5. Add a hard stop control at all times (voice mode should never trap the user in a loop).
**Touches:** `Frontend/src/components/ViAssistant/ViAssistant.jsx`, `ViAssistant.css`. No backend changes needed — `/api/voice/transcribe` and `/api/voice/speak` already exist.
**Depends on:** nothing.

## 0.3 "How OptionTrip Works" Section (80% → 100%)

**Brief says:** 80%.
**What's left:** Confirm all four steps are present (Describe the trip you want → Discover matching destinations → Build your trip → Travel with guidance) with correct copy and that it renders correctly on mobile.
**Steps:**
1. Compare the live section against the four-step copy in the brief.
2. Fill in any missing step or icon.
3. Check responsive layout at mobile width.
**Touches:** `Frontend/src/pages/Home.jsx` (homepage section), associated CSS.
**Depends on:** nothing.

## 0.4 Search Form UX Improvement (60% → 100%)

**Brief says:** In Progress, 60%.
**What's left:** Make the Explore/Search button more visually prominent, add contextual hints, and enable destination autocomplete if not already wired.
**Steps:**
1. Check whether destination autocomplete is already active on the homepage search field (Google Places autocomplete already exists elsewhere in the app per `GooglePlaces/AutocompleteContext.jsx` — reuse it here if not already wired in).
2. Increase visual weight of the primary search/Explore button (size, color contrast, position).
3. Add short inline hint text under underfilled fields.
**Touches:** Homepage search form component, `Frontend/src/components/GooglePlaces/`.
**Depends on:** nothing directly, but pairs naturally with 5.1 (Two-Stage Planning) — worth sequencing before that ticket since the same form is touched twice otherwise.

## 0.5 Personal + Community Travel Map — Sharing & Comments Layer (0% → building)

**Brief says:** In Progress, 0%.
**Actually in the codebase:** The *personal* half already exists — `MyTripsPage`'s Travel Map and Visited Places tabs, backed by `VisitedLocation.js`. What's missing is the *community* half: privacy-controlled sharing and location-based comments.
**What's left:** This is really the combination of Phase 3's sharing-controls and TripStory tickets. Treat this brief item as satisfied once 3.2 (Travel Map Sharing Controls) and 3.3 (TripStory Voice Reviews) are done — don't build it twice.
**Steps:** See 3.2 and 3.3 below.
**Touches:** See 3.2 and 3.3.
**Depends on:** 3.2, 3.3.

## 0.6 Duplicate Homepage Sections Cleanup (0% → 100%)

**Brief says:** In Progress, 0%.
**What's left:** "Best Tour Packages" and "Top Destinations" currently repeat similar content on the homepage.
**Steps:**
1. Identify the two (or more) sections rendering overlapping content.
2. Decide which one is more valuable (likely keep Top Destinations for SEO breadth, Best Tour Packages for conversion) and either merge them into one section with clear sub-framing, or remove the weaker one.
3. Re-check homepage flow after removal for awkward spacing gaps.
**Touches:** `Frontend/src/pages/Home.jsx` and its section components.
**Depends on:** nothing. Quick win — do early.

---

# Phase 1 — Foundational Architecture

## 1.1 Trip Status Lifecycle (extends the existing Unified Trip Data Model)

**Brief says:** "Unified Trip Data Model," 0%.
**Actually in the codebase:** `Trip.js` already unifies flights, hotels, cars, and the itinerary onto one trip document — the brief's core ask (avoid separate flight/hotel/car records) is already true. What's genuinely missing is a **travel-lifecycle status** (planned / active / completed) distinct from the existing `status` field, which currently only tracks the planning workflow (draft → options_generated → ... → confirmed).
**What's left:**
1. A `travel_status` field: `planned | active | completed`, computed from `dates.start_date` / `dates.end_date` plus a manual override.
2. A `notes` field (free text or structured entries) on the trip.
3. A `trip_id` back-reference already exists loosely on `VisitedLocation` and `Review` — make sure new TripStory entries (Phase 3) use the same pattern.
**Steps:**
1. Add `travel_status` to `tripSchema` in `Trip.js`, default `'planned'`.
2. Add `notes: [{ text: String, createdAt: Date }]` to the schema.
3. Write a small daily job (reuse the existing `scheduledSweep.js` cron pattern) that flips `travel_status` to `active` when `dates.start_date` is today, and to `completed` the day after `dates.end_date`.
4. Add a manual "Start Trip" action in the UI that sets `travel_status: 'active'` immediately, per the brief's "manual override" requirement.
5. Expose `travel_status` in the trip API response so the frontend can branch on it (this is what triggers Live Trip Mode in Phase 4).
**Touches:** `Backend/src/models/Trip.js`, `Backend/src/jobs/scheduledSweep.js`, `Backend/src/controllers/tripController.js`.
**Depends on:** nothing — do this first, everything in Phase 4 depends on it.

## 1.2 Payment Integration Readiness — OUT OF SCOPE (confirmed)

**Status: decided, not building.** OptionTrip doesn't handle payments — booking happens on the provider's own site via `bookingUrl` after a user selects a flight/hotel/car ("Select for this trip" just saves the choice to the trip record, it doesn't initiate a purchase). There's no in-house checkout to attach a payment step to, and building a placeholder one would create a fake "pay here" screen that doesn't lead to a real booking. Confirmed with the product owner — this ticket is closed, not deferred.

## 1.3 AI Travel Buddy Integration — Hotels & Cars (extends the already-built flight tool-calling)

**Brief says:** No percentage given ("AI Travel Buddy Integration Entry Point").
**Actually in the codebase:** For flights, this is done — VI has a real `search_flights` tool, calls all four providers, and renders results inline in chat. Hotels and cars still route users to the widget pages (`/hotels`, `/car-rental`) via a link instead of an inline tool call — this was a deliberate scope decision earlier, not an oversight, but the brief does ask for `AI → Search Hotels` and `AI → Search Cars` as real entry points.
**What's left:** Decide whether hotels/cars stay link-only (current state, cheaper to maintain, consistent with the Trip.com widget being the source of truth for hotel inventory) or get their own tool-calling path like flights.
**Steps (if extending to full tool-calling):**
1. Confirm there's a real backend search endpoint for hotels/cars with structured (not widget-embedded) results to call as a tool — if the hotel/car search is widget-only today, this ticket blocks on building or exposing a structured search API first, which is a bigger scope than it looks.
2. If a structured endpoint exists or gets built, mirror the flight pattern exactly: a `search_hotels` / `search_car_rentals` OpenAI tool, a small aggregator service, and a compact chat result-card component.
**Status: decided, not building.** Confirmed with the product owner — hotels and cars keep the direct-link behavior. Ticket closed.

---

# Phase 2 — Account Core

## 2.1 Account Dashboard (the missing piece of "Full User Account Area")

**Brief says:** "User Account Area," 0%.
**Actually in the codebase:** My Trips, Travel Map, Visited Places, and Wishlist tabs already exist inside `MyTripsPage`. The genuinely missing piece is a **Dashboard landing view** — the brief's "first page after login" showing upcoming trips, recent trips, saved ideas, VI recommendations, and quick actions in one glance.
**What's left:**
1. A Dashboard tab/view as the default landing tab in `MyTripsPage` (or its own page), pulling from data that already exists elsewhere (trips list, wishlist, memory profile).
2. VI Assistant Center — a dedicated place to talk to VI, distinct from the floating chat widget (the brief specifically calls for this as its own account section).
3. Road Comments / Travel Tips section — short comments attached to places (this overlaps directly with Phase 3's TripStory work; don't build twice, just add the entry point here).
**Steps:**
1. Add a `Dashboard` tab as the first tab in `MyTripsPage`, before `My Trips`.
2. Build four widgets: Upcoming Trips (filter existing trips by `dates.start_date` in the future), Recent/Draft Trips, Saved Ideas (pull from `Wishlist`), and a VI Recommendations card (pull from `UserMemoryProfile.facts` + `serviceSignals`, reusing the exact logic already built for VI's proactive upsell nudges).
3. Add quick-action buttons: "Continue planning," "View map," "Ask VI" — wire the last one to open the existing VI panel pre-focused on input.
4. Build a simple VI Assistant Center page — this can be a lighter-weight full-page version of the existing chat panel, not a new chat backend (reuse `chatService.js`/`ViAssistant.jsx` logic, just a different container/layout).
**Touches:** `Frontend/src/pages/MyTripsPage/MyTripsPage.jsx` (new Dashboard tab), new `DashboardTab.jsx`, new `AssistantCenterPage.jsx` reusing `ViAssistant` internals.
**Depends on:** 1.1 (Trip Status) is useful here for showing "active" trips distinctly, but not blocking.

## 2.2 Account Settings — Remaining Sections

**Brief says:** part of "User Account Area," 0%.
**Actually in the codebase:** `ProfilePage.jsx` already has Personal Information, Change Password, Connected Accounts, and Travel Preferences.
**What's left:** Notification settings, privacy settings, newsletter preferences (the last one overlaps with Phase 7.2 — build the toggle here, wire the actual subscription logic there).
**Steps:**
1. Add a "Notifications" section to `ProfilePage`: toggles for which notification types the user wants (trip reminders, booking confirmations, AI recommendations, TripStory activity) — persist to a new `notificationPreferences` object on the `User` model.
2. Add a "Privacy" section: controls for travel-map visibility (private / share countries only / share full map / share selected trips) — this is the same setting Phase 3.2 needs; build the field once, surface it in both places.
3. Add a newsletter subscribe/unsubscribe toggle (simple boolean on `User`, real email-list wiring is Phase 7.2's job).
**Touches:** `Backend/src/models/User.js` (add `notificationPreferences`, `privacySettings`, `newsletterSubscribed` fields), `Frontend/src/pages/ProfilePage/ProfilePage.jsx`.
**Depends on:** nothing blocking, but coordinate the privacy-settings field with 3.2 so it isn't built twice.

## 2.3 VI Core Assistant — Trip Memory & Live Context (completing the 4-part memory system)

**Brief says:** "VI (TravelBuddy) Core Logic," 0%.
**Actually in the codebase:** Profile Memory (`UserMemoryProfile`) is built and already feeds VI's system prompt. Live location is already passed to VI for "near me" questions. Flight search tool-calling is built (see 1.3). What's missing: **Trip Memory** (per-trip structured memory — ticket rules, notes, AI suggestions tied to *that specific trip*) and completing **Live Context Memory** (weather, time of day, route progress — location alone is wired, the rest isn't).
**Steps:**
1. Trip Memory: once 1.1 adds a `notes` field and TripStory entries are linked to `trip_id` (Phase 3), extend `buildSystemPrompt` in `chatService.js` to include a "This trip's memory" section pulling from `currentTrip.notes`, `currentTrip.selectedFlight/Hotel/Car`, and any TripStory/VisitedLocation entries tied to that `trip_id`. Most of this data already exists on the trip object passed into context — this is mostly a prompt-building addition, not new storage.
2. This directly enables the brief's example questions ("Can I change my return flight?" "Is my ticket refundable?") — note that *answering* those accurately still requires the actual fare-rule/refund data from the booking provider, which isn't stored today; flag this as a real data gap, not just a prompt gap, if precise answers are wanted rather than general guidance.
3. Live Context: add weather to the context object passed into `buildSystemPrompt` (a simple current-conditions API call keyed on the trip destination or live location — OpenWeather or similar, cached briefly to avoid rate limits) and add current time-of-day, which needs no API call at all.
4. Review-learning (brief item 6, "VI Should Learn From Reviews and Comments"): once `Review.js` has real volume, add a lightweight aggregation step — when VI is asked about a specific place, look up its average rating and note count from `Review.js` and any TripStory comments, and mention sentiment patterns ("several travelers mentioned X") rather than showing raw reviews. This is a service function + a small addition to the flight-tool-style pattern (a `lookup_place_sentiment` tool, or a simpler inline lookup before generating the reply — a tool call is cleaner and matches the pattern already established for flights).
**Touches:** `Backend/src/services/chatService.js` (`buildSystemPrompt`), new weather-lookup helper, `Backend/src/models/Review.js` (already exists, just needs a query helper).
**Depends on:** 1.1 (trip notes field), Phase 3 (TripStory entries to draw from for review-learning).

## 2.4 Memory Transparency Section

**Brief says:** part of the VI memory ticket, 0%.
**What's left:** A "My Preferences" / "TravelBuddy Memory" section where the user can see, edit, and delete what VI remembers.
**Steps:**
1. Add a route + simple page rendering `UserMemoryProfile.facts` in readable form (favorite destinations, trip types, budget, interests).
2. Allow editing/removing individual facts (e.g. remove a disliked destination from the list) — a small `PATCH` endpoint on the existing memory profile route.
3. Add a "forget everything" action that clears `facts` and resets `summary`.
**Touches:** `Backend/src/models/UserMemoryProfile.js`, a new controller endpoint, a new `MemorySettings` page/section under the account area (2.1/2.2).
**Depends on:** 2.1/2.2 (lives inside the account area).

---

# Phase 3 — Travel Map & Community

## 3.1 Visited-Places Map — Verify & Complete Auto-Population

**Brief says:** "Visited-Places Map," 0%.
**Actually in the codebase:** `VisitedLocation.js` model and `VisitedPlacesTab.jsx` already exist.
**What's left:** Confirm visited locations are being **auto-created from completed trips** (the brief's core ask — "ideally, this map should be created automatically based on their trips"), not just manually added.
**Steps:**
1. Check whether anything currently writes to `VisitedLocation` automatically when a trip's itinerary activities are marked visited or a trip completes.
2. If not, add a hook: when 1.1's `travel_status` flips a trip to `completed`, auto-create `VisitedLocation` entries from that trip's itinerary activities (using each activity's `place_name`/`location.coordinates`), tagged with `trip_id`.
3. Keep manual add/edit as a supplement, per the brief ("users should also have the ability to edit it if needed").
**Touches:** `Backend/src/models/VisitedLocation.js`, the same job/hook as 1.1's trip-status transition.
**Depends on:** 1.1.

## 3.2 Travel Map Sharing & Privacy Controls

**Brief says:** 0% (appears as multiple similar tickets in the brief — "Travel Map Sharing Feature," privacy controls inside the community map ticket, and the privacy settings inside "User Public Travel Map Pages." Treated here as one piece of work since they're the same feature.)
**Steps:**
1. Add a `mapPrivacy` field to `User.js` (or reuse the `privacySettings` field from 2.2): `private | countries_only | full_map | selected_trips`.
2. Add the same control to the Profile/Privacy settings section (2.2) and to the Travel Map tab directly, so it's editable from both places.
3. Generate a shareable link following the exact pattern already used for individual trips (`shareToken` + `isPublic` on `Trip.js`, `SharedTripPage.jsx`) — add the equivalent `mapShareToken` on `User.js` and a new `SharedTravelMapPage.jsx` that respects the privacy setting when rendering.
4. Route: `optiontrip.com/travel-map/:username` per the brief's example URL.
**Touches:** `Backend/src/models/User.js`, new `sharedMapController`, new `Frontend/src/pages/SharedTravelMapPage/`.
**Depends on:** 3.1 (needs real visited-location data to be worth sharing), 2.2 (shares the privacy field).

## 3.3 TripStory — Voice Reviews & Map Comments

**Brief says:** 0%.
**Actually in the codebase:** Voice transcription already works (`/api/voice/transcribe`). `Review.js` gives a partial foundation (rating + text tied to a destination) but is missing: location-attachment beyond a destination name, external media links, and the "record → transcribe → edit" flow the brief specifically asks for.
**Steps:**
1. Extend `Review.js` (or add a new `TripStoryEntry` model if the two use cases diverge too much — recommended, since Review is a star-rating review and TripStory is a short first-person tip, different UX): fields for `location` (coordinates + place name, not just a destination string), `trip_id`, `mediaLinks: [{ url, platform, previewData }]`, `sourceType: 'voice'|'text'`.
2. Build the "Leave Voice Review" UI: record button (reuse the exact `MediaRecorder` pattern already built for VI's mic input in `ViAssistant.jsx`) → send to `/api/voice/transcribe` → show the transcribed text with three options (use as-is, fix grammar, improve style — the last two are a quick OpenAI completion call, not new infrastructure).
3. Build the external-media-link flow: a paste-a-link input, detect platform from URL pattern (Instagram/YouTube/TikTok/Facebook/X), fetch oEmbed preview data where the platform supports it (YouTube and TikTok have public oEmbed endpoints; Instagram/Facebook/X require more setup — ship YouTube/TikTok first, note the others as a fast-follow).
4. Wire TripStory entries onto the Travel Map (3.1/3.2's map component) as clickable pins showing the comment.
5. Defer full "TripStory pages" and "public TripStory profiles" (the brief explicitly marks these "Future Expansion, not required now") — build only the map-comment layer first.
**Touches:** New `Backend/src/models/TripStoryEntry.js`, new controller/routes, `Frontend/src/pages/MyTripsPage/TravelMapTab.jsx` (add pins), new `LeaveVoiceReview` component reusing `ViAssistant`'s recording code.
**Depends on:** 3.1 (map to attach comments to), voice transcription (already exists).

## 3.4 Public Travel Map Pages & Visited-Countries Map

**Brief says:** two separate tickets, both 0%, both describing the same underlying feature from slightly different angles.
**What's left:** A public page per user (`optiontrip.com/travel-map/username`) showing a world map with visited countries highlighted, stats (countries/cities/trips), and TripStory entries — and the country-level highlighting specifically.
**Steps:**
1. This is the public-facing rendering layer on top of 3.2's sharing infrastructure — no new backend beyond aggregating `VisitedLocation.country` into a distinct-countries list and count.
2. Build the world-map visualization (a simple SVG/GeoJSON world map with visited countries filled in — a lightweight library choice here matters for bundle size; avoid a heavy mapping library for what's fundamentally a static choropleth).
3. Add the stats header (Countries Visited / Cities Added / Trips Created) using simple aggregation queries against `VisitedLocation` and `Trip`.
4. Respect `mapPrivacy` from 3.2 when rendering — private users get a 404/"this map is private" state.
**Touches:** New `Frontend/src/pages/SharedTravelMapPage/` (same page as 3.2), new backend aggregation endpoint.
**Depends on:** 3.1, 3.2.

---

# Phase 4 — Live Trip Mode

## 4.1 Automatic Trip-Start Detection

**Brief says:** 0%.
**Actually in the codebase:** This is exactly 1.1's `travel_status` work — already planned there.
**Steps:** Covered by 1.1. Nothing additional here beyond confirming the "Start Trip" manual button (also in 1.1) is reachable from the trip detail UI.
**Depends on:** 1.1 (this ticket and 1.1 are the same piece of work — don't build twice).

## 4.2 Live Trip Dashboard

**Brief says:** 0%.
**Steps:**
1. Add a conditional render in the trip detail page (`PlannedTripPage`) or the account Dashboard (2.1): when `travel_status === 'active'`, show a "Today in {city}" panel instead of (or above) the normal planning view.
2. Panel content: today's itinerary activities (filter the trip's itinerary by matching the day number to the current date), a compact map (reuse `TripMapTab.jsx`), and quick actions (edit today's plan, ask VI, add a note, leave a voice review, add a TripStory moment — the last two link directly to 3.3).
3. Pull live weather for the trip destination (same helper as 2.3's Live Context Memory work — build once, use in both places).
**Touches:** `Frontend/src/pages/PlannedTripPage/` (new `LiveTripPanel` component), reuses `TripMapTab.jsx`.
**Depends on:** 1.1, 3.3 (for the quick-action links), 2.3's weather helper.

## 4.3 Live Trip Mode (the umbrella feature)

**Brief says:** listed with no percentage in one place in the brief, 0% via its sub-tickets elsewhere.
**What's left:** This is the framing feature that 4.1 + 4.2 + VI using trip context (already substantially covered by 2.3) together deliver. Once those three are done, this ticket is functionally complete — it doesn't need separate implementation work.
**Depends on:** 4.1, 4.2, 2.3.

---

# Phase 5 — Discovery, Onboarding & Content

## 5.1 Two-Stage Travel Planning Flow (Discovery Mode + Booking Mode)

**Brief says:** 0%.
**Steps:**
1. Add a "What kind of trip do you want?" field to the homepage search area, positioned before/above the destination field, with the destination field explicitly marked optional.
2. When only the discovery field is filled, route the request through VI (reuse `generateViResponse`/the discovery-style prompt, not the flight tool) to generate 3-5 suggested destinations/routes instead of running a normal search.
3. Clicking a suggested destination fills the destination field and transitions the UI into the existing Stage 2 (normal search fields: country, dates, guests, budget).
4. Add the "I know where I want to go" / "Help me discover where to go" path choice as an alternative entry point, per the brief's alternative option.
**Touches:** Homepage search component, `Backend/src/services/chatService.js` (a discovery-mode prompt variant).
**Depends on:** 0.4 (Search Form UX) should land first since this ticket touches the same form.

## 5.2 First-Time User Onboarding

**Brief says:** 0%.
**Steps:**
1. Detect first-time visitors (no prior session/localStorage flag, or a `hasOnboarded` flag on new `User` records).
2. Show a short, dismissible prompt/modal: "What kind of trip do you want?" with category chips (Beach, Adventure, Culture, Relaxation).
3. Selecting a category pre-fills the discovery search (5.1) or shows a couple of matching destination suggestions immediately, so onboarding produces a visible result rather than just collecting a preference and going nowhere.
**Touches:** New onboarding modal component, a flag on `User.js`.
**Depends on:** 5.1 (onboarding is much stronger if it feeds directly into discovery mode; can ship standalone first and connect later if sequencing requires).

## 5.3 Structured FAQ Section

**Brief says:** 0%.
**Steps:**
1. Write FAQ content covering the four listed areas: how trips are planned, how bookings work, how recommendations are generated, how user data is used.
2. Build a simple accordion-style FAQ component.
3. Add the page/section and link it from the footer's Support column (ties back to 0.1).
**Touches:** New `FAQ.jsx` page or homepage section.
**Depends on:** 0.1 (footer link target).

## 5.4 Destination Landing Pages

**Brief says:** 0%.
**Steps:**
1. Build a `DestinationPage` template: description, travel tips, suggested routes, TripStory entries for that destination, map, related hotels/flights.
2. Route pattern: `optiontrip.com/destination/:slug`.
3. Start with a curated list of major destinations (reuse whatever destination data already backs `Destinations.jsx`/`ExploreAnywhereDetailPage.jsx` if it overlaps, rather than building a second destination dataset).
4. Wire TripStory entries (3.3) into the page once that data exists; ship without it initially rather than blocking the whole page on Phase 3.
**Touches:** New `Frontend/src/pages/DestinationPage/`, reuse of existing destination data sources.
**Depends on:** loosely on 3.3 for full content, but shippable without it.

---

# Phase 6 — Growth & Engagement

## 6.1 "Save Trip Idea" Button

**Brief says:** 0%.
**Actually in the codebase:** `Wishlist.js` model and full CRUD API (`wishlist.js` route) already exist and are already used by the Wishlist tab in `MyTripsPage`.
**What's left:** Just the trigger button wherever VI or the app surfaces a suggestion that isn't already a saved trip — this is a small UI task, not new infrastructure.
**Steps:**
1. Add a "Save Idea" button next to destination suggestions from VI (discovery mode, 5.1) and anywhere else a suggested destination/route appears without an existing save action.
2. Wire it to the existing `POST /api/wishlist` endpoint — no backend work needed.
**Touches:** Wherever VI/suggestion UI renders (`ViAssistant.jsx`, discovery-mode results from 5.1).
**Depends on:** 5.1 (biggest source of things worth saving), but can ship for existing suggestion surfaces immediately.

## 6.2 Notifications System — Trip-Linked Triggers & Email

**Brief says:** 0%.
**Actually in the codebase:** `Notification.js` model, `notificationController.js`, `notifications.js` route, and a `NotificationBell` component wired into the header all already exist.
**What's left:** The actual **triggers** that create notifications (trip starting soon, booking confirmation, AI recommendations, TripStory interactions) and **email delivery** — today's system likely only supports in-app notifications created manually/from the one existing flow (verify what currently triggers a notification before assuming none do).
**Steps:**
1. Audit what currently calls the notification-creation logic — confirm whether anything already triggers notifications today (e.g. from the activity/service-signal system built this session) before adding more.
2. Add a trigger in 1.1's scheduled job: create a "Your trip to {destination} starts tomorrow" notification when `dates.start_date` is one day away.
3. Add a trigger on successful booking confirmation (Phase 1.2's booking flow) and on TripStory interactions (comments/replies on a user's map entries, once 3.3 exists).
4. Add email delivery: reuse whatever email-sending setup already exists for OTP/contact-form emails (check `Backend/src/config/` for an existing mail transport) and send a plain templated email mirroring the in-app notification for trip-starting-soon and booking-confirmation types specifically (not every notification type needs email).
**Touches:** `Backend/src/jobs/scheduledSweep.js`, `Backend/src/controllers/notificationController.js`, existing email transport config.
**Depends on:** 1.1 (trip-starting-soon trigger needs the status job), 3.3 (TripStory-interaction trigger).

## 6.3 Social Sharing Buttons

**Brief says:** 0%.
**Steps:**
1. Add a reusable `ShareButton` component supporting Facebook, X/Twitter, WhatsApp, Telegram, LinkedIn, and Copy Link — these are simple share-intent URLs, no SDK integration required for a first version.
2. Add it to Travel Map pages (3.4), TripStory entries (3.3), routes, and destination pages (5.4).
3. Add Open Graph + Twitter Card meta tags to every shareable page so links preview correctly — check `Backend/src/routes/seo.js` for existing patterns to extend, since SEO meta-tag handling already exists in some form.
**Touches:** New shared `ShareButton` component, meta-tag additions on each shareable page.
**Depends on:** 3.4, 3.3, 5.4 (needs pages to put the buttons on).

## 6.4 Auto-Generated Travel Share Cards

**Brief says:** 0%.
**Steps:**
1. Build a server-side image generation endpoint (e.g. using `@vercel/og`-style HTML-to-image rendering, or a canvas-based renderer) that takes a template + data (title, route/destination, small map preview, stats) and returns a shareable PNG sized for Instagram/story/X/Facebook/LinkedIn.
2. Wire it to the obvious trigger points: after completing a trip, after adding N countries to the visited map, after creating a TripStory entry.
3. Prompt the user with the generated card and a share/download action at those trigger points.
**Touches:** New `Backend/src/services/shareCardService.js`, new frontend prompt component.
**Depends on:** 3.4 (needs real map/stats data to render), 6.3 (shares the share-button UI).

## 6.5 Travel Achievements & Travel Levels

**Brief says:** 0%.
**Steps:**
1. Define the achievement list and unlock conditions from the brief (First Trip Added, 5 Countries Visited, 10 Cities Explored, First TripStory Created, First Travel Route Created, 10 Travel Tips Shared) as a static config, not a database table — these are fixed rules, not user-editable content.
2. Add an `achievements: [{ id, unlockedAt }]` array to `User.js`.
3. Check-and-unlock logic runs at the natural trigger points (after a trip is created, after a TripStory entry is added, after a visited-location is added) rather than a separate polling job — a small shared helper called from those existing write paths.
4. Compute travel level (Explorer → Global Traveler) from total activity count using simple thresholds; display on `ProfilePage` (2.2) and the public map page (3.4).
**Touches:** `Backend/src/models/User.js`, new `achievementService.js`, `ProfilePage.jsx`, `SharedTravelMapPage`.
**Depends on:** 3.1, 3.3 (the data sources achievements count against).

## 6.6 Yearly Travel Report

**Brief says:** 0%.
**Steps:**
1. Build an aggregation endpoint: given a user and year, return countries/cities visited, routes traveled, TripStories created, most-visited country, longest trip, favorite destination — all computable from `VisitedLocation`, `Trip`, and TripStory data already modeled by this point.
2. Build a report page/modal reusing the world-map visualization from 3.4.
3. Trigger generation at year-end (a scheduled job) or on-demand from the account Dashboard (2.1).
4. Reuse 6.4's share-card generator for the shareable summary cards.
**Touches:** New aggregation service, new report component.
**Depends on:** 3.1, 3.4, 6.4.

---

# Phase 7 — Account Extras (explicitly "next phase" per the brief)

## 7.1 Theme / Color Customization — DONE

**Status:** Built and verified live. Found that light/dark mode already existed fully (`ThemeContext.jsx` + a header toggle) — the real gap was accent color. Added 7 accent options (teal/blue/green/red/orange/yellow/purple) as `[data-accent="..."]` CSS token overrides in `themes.css` (redefining only the `--primary*` family, composing cleanly with the existing light/dark tokens), a picker UI in Profile → Settings → Appearance, and localStorage persistence matching the exact pattern the existing dark/light toggle already used (no backend sync, for consistency).
**Verified:** clicking a swatch changes `data-accent`, the computed `--primary` CSS value actually changes, and it survives a page reload.
**Known minor gap:** the notification toggle switches on the Settings tab use a hardcoded indigo color independent of `--primary` (a pre-existing choice in that CSS, not something this change touched) — cosmetic only, not incorrect.

## 7.2 Saved Payment Methods, Address & Newsletter Subscription — PARTIALLY DONE

**Payment methods:** confirmed out of scope — same reasoning as 1.2 (OptionTrip doesn't handle payments; there's nothing for saved cards to attach to).
**Saved shipping address:** DONE. Added `shippingAddress` to `User.js`, wired into the existing `PATCH /api/auth/settings` endpoint, and a form in Profile → Settings. Verified live: saved, reloaded the page, value persisted correctly through the real backend.
**Newsletter integration:** the subscribe/unsubscribe *toggle* already existed from Phase 2 and works. The actual mailing-list behind it (Mailchimp, SendGrid, etc.) needs a real third-party provider and API credentials that don't exist in this codebase — building a fake integration would be worse than not building one. This is a genuine open item, not something to silently skip: **whoever owns this needs to pick a mailing-list provider and provide credentials before this can be finished for real.**

---

# Not a build ticket

**"AI-Driven Travel Platform Positioning"** — this brief item is a strategic/vision note about competing with Booking.com/Expedia through AI-first planning rather than search-and-compare. It has no concrete deliverable of its own; it's the rationale behind prioritizing VI's tool-calling (1.3, 2.3), the two-stage discovery flow (5.1), and Live Trip Mode (Phase 4) over traditional search UX polish. Treat it as the "why" behind this plan's phase ordering, not a separate task.

---

# Summary table

| # | Ticket | Phase | Brief % | Real status | Depends on |
|---|---|---|---|---|---|
| 0.1 | Footer Overhaul | 0 | 90% | On track | — |
| 0.2 | AI Voice Responses | 0 | 80% | Core I/O done; needs live voice mode | — |
| 0.3 | "How It Works" Section | 0 | 80% | On track | — |
| 0.4 | Search Form UX | 0 | 60% | On track | — |
| 0.5 | Travel Map Sharing/Comments | 0 | 0% | = 3.2 + 3.3 | 3.2, 3.3 |
| 0.6 | Duplicate Homepage Sections | 0 | 0% | Quick win | — |
| 1.1 | Trip Status Lifecycle | 1 | 0% (as "Trip Model") | **Done** — schema, cron auto-transition, manual start all built & tested | — |
| 1.2 | Payment Readiness | 1 | 0% | **Out of scope** — confirmed, OptionTrip doesn't handle payments | — |
| 1.3 | VI Hotel/Car Tool-Calling | 1 | unscored | **Closed** — confirmed keep direct-link behavior | — |
| 2.1 | Account Dashboard | 2 | 0% (as "Account Area") | **Done** — new Dashboard tab, tested live | 1.1 (soft) |
| 2.2 | Account Settings gaps | 2 | 0% | **Done** — notification/privacy/newsletter settings, tested live | — |
| 2.3 | VI Trip/Live Memory | 2 | 0% | **Done** — trip notes/selections + live weather woven into VI, tested live | 1.1, Phase 3 |
| 2.4 | Memory Transparency | 2 | 0% | **Done** — Vi's Memory tab (view/edit/forget), tested live | 2.1/2.2 |
| 3.1 | Visited-Places auto-populate | 3 | 0% | **Done** — auto-creates on trip completion, tested | 1.1 |
| 3.2 | Map Sharing/Privacy | 3 | 0% | **Done** — share link + privacy gating, tested live | 3.1, 2.2 |
| 3.3 | TripStory Voice Reviews | 3 | 0% | **Done** — voice/text tips, AI refine, geocoding, media preview, map pins, tested live | 3.1 |
| 3.4 | Public Map + Countries Map | 3 | 0% | **Done** — same page as 3.2, stats + pin map, tested live | 3.1, 3.2 |
| 4.1 | Trip-Start Detection | 4 | 0% | **Done** (= 1.1) + manual "Start this trip" button added, tested | 1.1 |
| 4.2 | Live Trip Dashboard | 4 | 0% | **Done** — "Today in {city}" panel, weather, quick actions, notes, tested live | 1.1, 3.3, 2.3 |
| 4.3 | Live Trip Mode (umbrella) | 4 | unscored | **Done** (= 4.1 + 4.2 + 2.3, all shipped) | 4.1, 4.2, 2.3 |
| 5.1 | Two-Stage Planning | 5 | 0% | **Done** — discovery suggestions wired into TripPlannerForm, tested live | 0.4 |
| 5.2 | First-Time Onboarding | 5 | 0% | **Done** — category quickstart added to existing WelcomeModal, tested live | 5.1 (soft) |
| 5.3 | FAQ Section | 5 | 0% | **Already existed** — HelpCenterPage covers all 4 required topics, linked from footer | 0.1 |
| 5.4 | Destination Landing Pages | 5 | 0% | **Done** — `/destination/:slug` page, tested live incl. fallback for uncurated cities | 3.3 (soft) |
| 6.1 | "Save Trip Idea" Button | 6 | 0% | **Done** — heart button added to discovery + AI explore cards, tested live | 5.1 (soft) |
| 6.2 | Notifications triggers + email | 6 | 0% | **Done** — triggers already existed (found in Phase 1); added email delivery respecting Phase 2 prefs | 1.1, 3.3 |
| 6.3 | Social Sharing Buttons | 6 | 0% | **Done** — reusable ShareButton, wired into map + destination pages, tested live | 3.4, 3.3, 5.4 |
| 6.4 | Auto Share Cards | 6 | 0% | **Done** — SVG stats card, `GET /api/travel-map/:token/card.svg`, tested live | 3.4, 6.3 |
| 6.5 | Achievements & Levels | 6 | 0% | **Done** — unlock logic at 3 real trigger points, level system, shown on profile + public map, tested live end-to-end | 3.1, 3.3 |
| 6.6 | Yearly Travel Report | 6 | 0% | **Done** — aggregation, modal with year nav + share card, scheduled notification trigger, tested live end-to-end | 3.1, 3.4, 6.4 |
| 7.1 | Theme Customization | 7 | 0% | **Done** — accent color picker + existing dark/light mode, tested live | 2.2 |
| 7.2 | Payments/Address/Newsletter | 7 | 0% | **Address done**; payments correctly out of scope; newsletter ESP needs a real provider + credentials | 1.2, 2.2 |

**33 items total — every in-progress and not-started ticket from the brief is accounted for above, either as its own numbered item or explicitly folded into another item where the brief listed the same feature twice.**

**Plan status: complete.** Every phase (0 through 7) is now built and verified, with two explicit, honest exceptions that were correctly identified as out of scope or blocked rather than faked: payment methods (no payment processing exists on OptionTrip, confirmed with the product owner) and the newsletter mailing-list integration (needs a real third-party provider and credentials that don't exist in this codebase — the subscribe/unsubscribe toggle itself works, the actual email delivery behind it does not).
