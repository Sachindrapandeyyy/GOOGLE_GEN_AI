# Sukoon AI MVP Demo Script

## Demo Overview
**Duration:** 90 seconds  
**Focus:** Core flows - Diary → Pub/Sub, Mood Logging → Pub/Sub, Chat → AI Response → Risk Triage

---

## Slide 1: Introduction (15 seconds)

**Narrator:** "Sukoon AI is a mental health support platform that provides users with a safe, private space to track their emotional well-being through diary entries, mood logging, and AI-powered chat support.

**Key Features:**
- **Diary:** Private journaling with offline support
- **Mood Tracking:** Simple emotional state logging
- **AI Chat:** Empathetic conversations with built-in safety features
- **Risk Triage:** Automatic crisis detection and escalation

**Live Demo:** Show the app running at http://localhost:3000"

---

## Slide 2: User Journey - Onboarding (15 seconds)

**Show:** Onboarding flow

**Narrator:** "New users get a simple onboarding experience. We use pseudonymous IDs for privacy - no personal information required.

**Live Action:**
1. Open the app
2. Click through onboarding slides
3. Show pseudonymous user ID generation
4. Navigate to main dashboard"

---

## Slide 3: Core Feature Demo - Diary (20 seconds)

**Show:** Diary creation and saving

**Narrator:** "The diary feature allows users to write private entries that are automatically saved and published to our event system.

**Live Demo:**
1. Navigate to Diary page
2. Write a sample entry: 'Today was challenging but I got through it'
3. Click 'Publish'
4. Show the entry appears in the list
5. **Technical Highlight:** Entry triggers `diary.saved` Pub/Sub event

**Architecture Note:** 'Data flows from frontend → BFF → Diary service → Firestore + Pub/Sub'"

---

## Slide 4: Mood Tracking + Chat Integration (25 seconds)

**Show:** Mood logging and chat interaction

**Narrator:** "Users can quickly log their mood, and our AI chat provides empathetic support with built-in guardrails.

**Live Demo:**
1. Go to Mood page
2. Select mood (e.g., 'Good')
3. Add note: 'Feeling positive after exercise'
4. Click 'Log Mood'
5. **Technical Highlight:** Triggers `mood.logged` Pub/Sub event

6. Navigate to Chat
7. Send message: 'I feel anxious about tomorrow'
8. Show AI response with empathy
9. **Technical Highlight:** Message → Vertex AI → Risk assessment → `chat.saved` event

10. Send crisis message: 'I feel hopeless'
11. **Safety Feature:** Show risk detection and escalation
12. **Technical Highlight:** Crisis keywords → `risk.flagged` event → Triage service"

---

## Slide 5: Insights & Architecture (15 seconds)

**Show:** Insights dashboard and architecture diagram

**Narrator:** "Users get personalized insights from their data, and our system ensures safety and privacy.

**Key Technical Points:**
- **Microservices:** Independent, scalable services
- **Event-Driven:** Pub/Sub for loose coupling
- **Privacy-First:** KMS encryption, DLP redaction
- **Safety-First:** Crisis detection, human escalation
- **Production-Ready:** Cloud Run deployment, no Docker needed

**Live Demo:**
1. Go to Insights page
2. Show mood trends and recommendations
3. Highlight offline capability (PWA)

**Closing:** 'Sukoon AI demonstrates how AI can provide accessible mental health support while prioritizing user safety and privacy.'"

---

## Technical Notes for Demo

### Pre-Demo Setup:
1. Ensure all services are running locally
2. Have test data ready
3. Prepare browser with app open
4. Have monitoring dashboard ready to show

### Backup Scenarios:
- If Vertex AI fails: Show mock response
- If Pub/Sub fails: Show local event logging
- If services are slow: Pre-populate with demo data

### Key Demo Points to Hit:
- ✅ Diary creation → Pub/Sub event
- ✅ Mood logging → Pub/Sub event
- ✅ Chat message → AI response → Risk triage
- ✅ Crisis detection and escalation
- ✅ Offline capability demonstration
- ✅ Privacy and safety features

### Timing Breakdown:
- 0-15s: Intro and onboarding
- 15-35s: Diary creation demo
- 35-60s: Mood + Chat integration
- 60-75s: Crisis detection
- 75-90s: Insights and closing

**Success Criteria:** Clear demonstration of core flows, safety features, and technical architecture.
