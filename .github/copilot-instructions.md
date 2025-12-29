# Automations Dashboard - AI Coding Instructions

## Project Overview
React + TypeScript + Vite application for automating Gmail email management with AI-powered summarization and reply generation. Uses Google OAuth for Gmail API access and Google Gemini API for AI features.

## Architecture

### Core Service Boundaries
- **GmailServices** ([src/classes/GmailServices.ts](src/classes/GmailServices.ts)): Handles all Gmail API interactions (fetch emails, send replies, decode base64-encoded email bodies)
- **GeminiServices** ([src/classes/GeminiServices.ts](src/classes/GeminiServices.ts)): Static class for Google Gemini API calls (email summarization, reply generation, writing style analysis)
- **Auth flow** ([src/Auth.ts](src/Auth.ts), [src/Auth.tsx](src/Auth.tsx)): Google OAuth token management using Google Identity Services (GIS) library

### Class Hierarchy
```
Email (abstract base)
├── ReceivedEmail (has sender, can genSummary/genReply/sendReply)
└── SentEmail (has recipient)
```

**Key Pattern**: ReceivedEmail delegates AI operations to GeminiServices and Gmail operations to GmailServices - it acts as a coordinator, not a data-only class.

### Data Flow
1. User authenticates → `getAccessToken()` returns OAuth token
2. Token passed to `GmailServices` constructor
3. `GmailServices.getReceivedEmails()` → fetches from Gmail API → returns `ReceivedEmail[]`
4. User clicks "Summarize" → `email.genSummary()` → `GeminiServices.genSummary(body)` → displays result
5. User clicks "Reply" → `email.genReply(user)` → `GeminiServices.genReply(style, body)` → user edits → `email.sendReply()`

## Development Workflows

### Environment Setup
Required environment variables in `.env.local`:
```bash
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### Commands
- `npm run dev` - Start dev server with HMR (port 5173)
- `npm run build` - TypeScript compile + Vite production build
- `npm run preview` - Preview production build locally
- `npm run lint` - ESLint with flat config (eslint.config.js)

### Mock Data Mode
[App.tsx](src/App.tsx) includes `useMockData` state for development without OAuth. Toggle via "Use Mock Data" button to work with `mockEmails()` instead of real Gmail API calls.

## Project-Specific Conventions

### State Management
- No Redux/Zustand - uses React `useState`/`useEffect` only
- Access token stored in `App.tsx` state, passed down as needed
- Email list fetched on mount when `accessToken` changes

### Styling Approach
- **Inline styles** for layout/structure (see [App.tsx](src/App.tsx) sidebar and email list)
- **CSS files** for component-specific styling ([Auth.css](src/Auth.css), [class-styles/EmailFullView.css](src/class-styles/EmailFullView.css))
- No CSS framework - pure CSS with class names like `.auth-container`, `.email-full-view`

### API Integration Patterns
**Gmail API**: 
- All calls use `Authorization: Bearer ${token}` header
- Email bodies are base64url-encoded - use `decodeBody()` helper in GmailServices
- Fetch uses `?format=full` to get complete message payload including headers

**Gemini API**:
- Uses `@google/generative-ai` SDK with model `gemini-2.5-flash`
- Static class pattern - instantiate model once: `GeminiServices.genAI`
- API key from `import.meta.env.VITE_GEMINI_API_KEY`

### Routing
React Router DOM v7 with BrowserRouter:
- `/` - Inbox view (email list)
- `/email` - Full email view (uses `useLocation` state to pass `emailId`)
- Navigation via `<Link to="/email" state={{ emailId }}>` pattern

## Critical Implementation Details

### OAuth Token Handling
[Auth.ts](src/Auth.ts) uses Google Identity Services (GIS) loaded via script tag in [index.html](index.html):
```typescript
(window as any).google.accounts.oauth2.initTokenClient({...})
```
Must call `ensureGisLoaded()` before initializing - waits for GIS SDK to be available on window object.

### Email Sending
`GmailServices.sendReply()` constructs RFC 2822 email format manually, including `In-Reply-To` and `References` headers for threading. Body is base64url-encoded before sending to `/gmail/v1/users/me/messages/send`.

### Path Alias
Vite config defines `~` alias: `resolve: { alias: { '~': '/src' } }`. Import with `import X from '~/classes/X'`.

## When Adding Features

1. **New email operations**: Add methods to GmailServices (uses token in constructor)
2. **New AI features**: Add static methods to GeminiServices
3. **New email types**: Extend Email base class following ReceivedEmail/SentEmail pattern
4. **New routes**: Add to `<Routes>` in App.tsx, use Link with state for navigation
5. **Environment config**: Add to `.env.local` with `VITE_` prefix, access via `import.meta.env`
