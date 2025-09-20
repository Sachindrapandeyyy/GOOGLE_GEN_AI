# Sukoon AI Frontend

A beautiful, mobile-first Progressive Web App (PWA) for mental health support, featuring diary entries, mood tracking, AI chat, and personalized insights.

## 🎨 Features

- **Beautiful UI**: Calming color palette with soft gradients and animations
- **Mobile-First**: Responsive design that works great on all devices
- **Offline Support**: Full offline functionality with background sync
- **PWA Ready**: Installable on mobile and desktop devices
- **Animations**: Smooth transitions and micro-interactions using Framer Motion
- **Secure**: Local encryption for sensitive data

## 🏗️ Tech Stack

- **React 18** with TypeScript
- **Vite** for lightning-fast builds
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **Zustand** for state management
- **Recharts** for data visualization
- **IndexedDB** for offline storage
- **WebCrypto** for local encryption

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Core Flows

### Onboarding

- Beautiful animated onboarding flow
- Pseudonymous user creation (no login required)
- Privacy-first approach

### Diary

- Write and save diary entries
- Auto-save drafts
- Offline support with background sync
- View and edit past entries

### Mood Tracking

- Interactive mood slider with animations
- Add optional notes to mood entries
- View mood history and trends
- Insights based on mood patterns

### Chat Support

- AI-powered chat with streaming responses
- Crisis detection and escalation
- Chat history and conversation management
- Typing indicators and animations

### Insights

- Mood trend visualization
- Activity tracking
- Common themes analysis
- Personalized recommendations

## 🧩 Component Structure

```
src/
├── components/
│   ├── layout/       # Layout components
│   └── ui/           # Reusable UI components
├── hooks/            # Custom React hooks
├── lib/             # Third-party library configurations
├── pages/            # Page components
├── store/            # Zustand store
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## 📦 State Management

We use Zustand for global state management with the following stores:

- **User State**: Authentication and user preferences
- **Diary State**: Diary entries and drafts
- **Mood State**: Mood entries and statistics
- **Chat State**: Conversations and messages
- **App State**: UI state, offline status, etc.

## 🔌 API Integration

The frontend communicates with the BFF (Backend for Frontend) layer through:

- **REST API**: For simple CRUD operations
- **GraphQL**: For complex data fetching
- **Offline Queue**: For operations when offline

## 📱 PWA Features

- **Service Worker**: For offline support and caching
- **Web App Manifest**: For installability
- **IndexedDB**: For local data storage
- **Background Sync**: For offline operations

## 🎭 Design System

The design system follows these principles:

- **Colors**: Pastel purple, pink, blue with soft white backgrounds
- **Typography**: Inter and Nunito fonts for a friendly look
- **Components**: Rounded corners, soft shadows, smooth hover states
- **Animations**: Subtle, purposeful animations that enhance UX

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for the Sukoon AI MVP project
- Designed with mental health support as the primary focus
- Privacy and security as core principles
