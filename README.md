# AP Practice Partners

> **Vibe-coded** — built with AI assistance (Claude Code + Gemini), not traditional software engineering. It works, but treat it accordingly.

An open-source AI tutoring app for AP exam preparation, strictly aligned with official College Board Course and Exam Descriptions (CEDs). Each tutor enforces active-learning pedagogy: short explanations, mandatory follow-up questions, Bloom's taxonomy progression, and AP-style practice questions.

Built by a teacher, for students. Free to use, free to fork.

---

## ⚠️ Read Before You Deploy

**This app uses an AI API key. Mishandling it will cost you real money.**

- **Never commit your `.env.local` file to git.** It is in `.gitignore` — keep it there.
- **Never expose your API key in client-side code.** All AI calls go through the server-side API route (`/src/app/api/tutor/route.ts`). Do not move them to the browser.
- **The classroom code is not strong security.** It keeps casual visitors out, but it is not encryption. Do not store sensitive student data in this app — it isn't designed for that, and it doesn't.
- **This app collects no user data.** No accounts, no emails, no analytics, no session storage beyond your classroom code in `localStorage`. If you fork it, keep it that way.
- **Rotate your API key if you suspect exposure.** Google AI Studio and Anthropic both let you revoke and reissue keys instantly.

---

## What It Is

- 21 AP courses, each with a tutor scoped to its official College Board CED
- Active-learning protocol: ≤1 paragraph per explanation, mandatory question after every exchange
- 6 interaction modes: Explain, Practice, Review, Visualize, Quick Review, Explanation Partner
- Subject-specific pedagogy: sciences use SP framing, history uses DBQ/LEQ/SAQ, CS uses Java code blocks, etc.
- No user accounts, no data collection, no tracking

## What It Isn't

- A replacement for a teacher or official College Board materials
- Guaranteed to be accurate — AI can hallucinate. Always verify against the actual CED.
- A complete product — this is vibe-coded, lightly tested, and actively evolving

---

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **AI:** Google Gemini 2.5 Flash (via `@google/genai`)
- **Styling:** Tailwind CSS, Framer Motion
- **Auth:** Classroom code gatekeeper (localStorage + server-side header check)
- **Deployment:** Vercel (recommended)

---

## Setup

### Prerequisites

- Node.js 18+
- A Google AI Studio API key ([get one free](https://aistudio.google.com/))
- Optionally: a Vercel account for deployment

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/ap-practice-partners.git
cd ap-practice-partners
npm install
```

### 2. Configure environment variables

Copy the example env file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
GEMINI_API_KEY=your_google_ai_studio_key_here
CLASSROOM_CODE=your_access_code_here
```

- `GEMINI_API_KEY` — your Google AI Studio key. Keep this secret.
- `CLASSROOM_CODE` — the code students enter to access the app. Can be comma-separated for multiple valid codes: `code1,code2`.

**Never commit `.env.local` to git.**

### 3. Customize the app name

Open `src/app/layout.tsx` and change the metadata:

```tsx
export const metadata: Metadata = {
  title: "Your School AP Tutors",           // ← change this
  description: "Your description here",     // ← and this
};
```

Also update the header title in `src/app/page.tsx`:

```tsx
<h1 className="text-lg font-bold text-white leading-none">Your School AP Tutors</h1>
```

And the About page (`src/app/about/page.tsx`) to reflect your school or context.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Enter your classroom code when prompted.

### 5. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**. Do not put them in any committed file.

---

## Using a Different AI Provider

The AI calls live in one file: `src/app/api/tutor/route.ts`. To swap providers:

### Anthropic Claude

```bash
npm install @anthropic-ai/sdk
```

Replace the Gemini streaming call with:

```typescript
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const stream = await client.messages.stream({
  model: 'claude-opus-4-5',
  max_tokens: 2048,
  system: systemInstruction,
  messages: formattedMessages,
});
// pipe stream chunks to the ReadableStream controller
```

Update `ANTHROPIC_API_KEY` in `.env.local`. Note: Anthropic uses a separate `system` parameter rather than injecting it into `contents`.

### OpenAI

```bash
npm install openai
```

```typescript
import OpenAI from 'openai';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const stream = await client.chat.completions.create({
  model: 'gpt-4o',
  stream: true,
  messages: [
    { role: 'system', content: systemInstruction },
    ...formattedMessages,
  ],
});
```

### Important for all providers

- Keep API keys in `.env.local` only — never in client-side code
- All calls must go through the server-side API route — never from the browser
- The classroom code auth check in `route.ts` applies to all providers — keep it

---

## Adding a Course

### Step 1: Get the CED PDF

Download the official Course and Exam Description PDF from [College Board AP Central](https://apcentral.collegeboard.org/).

### Step 2: Extract CED data

Place the PDF in a folder called `SAS AP CEDs/` one level above the app root (i.e., alongside the app directory, not inside it), then run:

```bash
node scripts/extractCeds.mjs
```

This uses Gemini 2.5 Pro to extract structured JSON into `src/constants/extracted-ceds/`. The script skips files that already have a JSON — `FORCE_REEXTRACT = false` by default.

If the PDF fails to process (some PDFs are incompatible with the Gemini File API), create the JSON manually — see `src/constants/extracted-ceds/ap-biology.json` as a template.

**JSON schema:**

```json
{
  "courseName": "AP Course Name",
  "courseSlug": "ap-course-name",
  "practicesLabel": "Science Practices",
  "practices": "Description of assessed skills and weightings...",
  "units": [
    {
      "unitNumber": "1",
      "unitTitle": "Unit Title",
      "examWeight": "10-15%",
      "keyTopics": ["Topic 1", "Topic 2", "Topic 3"]
    }
  ],
  "examFormat": {
    "multipleChoice": "60 questions, 90 mins, 50%",
    "freeResponse": "6 questions, 90 mins, 50%"
  },
  "antiPatterns": "What the CED says is out of scope..."
}
```

### Step 3: Add to the course registry

Open `src/constants/courses.ts` and add an entry to the `COURSES` array:

```typescript
{
  displayName: 'AP Psychology',
  slug: 'ap-psychology',
  cedFile: 'ap-psychology',        // matches the JSON filename stem
  subjectArea: 'social',           // science | math | history | social | english | cs | economics | language | other
  emoji: '🧠',
  color: 'purple',                 // must have a matching entry in COLOR_CLASSES
},
```

Available colors: `emerald`, `violet`, `teal`, `cyan`, `sky`, `indigo`, `rose`, `pink`, `amber`, `orange`, `yellow`, `blue`, `purple`, `lime`, `green`, `red`.

That's it — the course will appear on the landing page immediately.

---

## Removing a Course

1. Delete the entry from the `COURSES` array in `src/constants/courses.ts`
2. Optionally delete the JSON file from `src/constants/extracted-ceds/`

The course card disappears from the landing page immediately. No other changes needed.

---

## Security Notes for Deployers

### What this app does NOT do (by design)

- No user accounts or authentication beyond the classroom code
- No database — nothing is persisted server-side
- No analytics or tracking scripts
- No third-party services beyond the AI API
- No cookies (the classroom code uses `localStorage`, not cookies)
- Chat history exists only in browser memory and is gone on page refresh

### What you must ensure

- **`.env.local` is never committed.** Check your `.gitignore` before every push.
- **Set API key restrictions.** In Google AI Studio, restrict your key to your deployment domain. In the Google Cloud Console, restrict by HTTP referrer.
- **Use Vercel environment variables** for production — not hardcoded values in any committed file.
- **The classroom code is not a password manager.** It is a lightweight barrier against casual access, not a security system. If you need real access control, this app is not the right foundation.
- **Do not log student inputs.** The app doesn't, but if you add logging middleware, be careful.
- **API costs are your responsibility.** Monitor your usage dashboard and set billing alerts.
- **Review your jurisdiction's student privacy laws** before deploying to real students. In the US, that means FERPA. In Singapore, PDPA. In the EU, GDPR. This app's no-PII design is intended to minimize compliance burden, but you are responsible for your deployment.

---

## FAQ

**Q: Is this affiliated with College Board?**
No. This is an independent tool built by a teacher using publicly available College Board CED documents. "AP" and "Advanced Placement" are trademarks of College Board. This project is not endorsed by or affiliated with College Board.

**Q: Is the AI accurate?**
Mostly, but not always. AI can confabulate — invent plausible-sounding but incorrect information. The CED JSON files constrain the scope, but do not guarantee accuracy. Always verify important concepts against the official CED PDF.

**Q: Is this free to use?**
Yes, under the MIT license. The AI API calls cost money (fractions of a cent per response), which you pay to your API provider. At typical student usage, a free-tier Google AI Studio account can handle hundreds of sessions per month before you hit rate limits.

**Q: Can I use this commercially?**
The MIT license technically permits it. However, this was built as a free educational tool. The author requests — though cannot legally require — that deployments remain free to students. Please don't monetize other people's kids' study sessions.

**Q: What's "vibe coding"?**
This app was built primarily through conversation with AI coding assistants (Claude Code), with the human author directing the work rather than writing most of the code by hand. It works well, but it has not been through rigorous QA, security auditing, or the kind of testing a production app normally receives. Use accordingly.

**Q: The bot said something wrong. What do I do?**
Open a GitHub Issue on this repo describing the course, the topic, and what the bot said incorrectly. If it's a systematic error, it's likely a prompt or CED data issue.

**Q: Can I add courses that aren't AP?**
Yes — the system is course-agnostic. Write a JSON file following the schema above, add an entry to `courses.ts`, and it will work. The active-learning pedagogy applies to any subject.

**Q: Why not just use ChatGPT directly?**
You could. The value here is the structured CED data injected into every prompt, the active-learning pedagogy rules, and the classroom code access gate. It's a specific, constrained experience rather than a general chatbot.

**Q: How do I report a bug or suggest a feature?**
Open a GitHub Issue on this repository.

---

## Project Structure

```
src/
├── app/
│   ├── api/tutor/route.ts        # AI API endpoint — all AI calls live here
│   ├── tutor/[course]/page.tsx   # Chat interface
│   ├── about/page.tsx
│   ├── feedback/page.tsx
│   ├── tutorial/page.tsx
│   └── page.tsx                  # Landing page / course grid
├── components/
│   └── Gatekeeper.tsx            # Classroom code auth gate
└── constants/
    ├── courses.ts                 # Course registry — add/remove courses here
    ├── activeLearning.ts          # Pedagogy rules and formatting instructions
    └── extracted-ceds/            # CED JSON files, one per course
scripts/
└── extractCeds.mjs               # CED extraction script (run once per course)
```

---

## Contributing

Pull requests welcome. For significant changes, open an issue first.

Please do not submit PRs that:
- Add user tracking or analytics
- Add paywalls or monetization features
- Remove the security warnings or data privacy design

---

## License

MIT — see [LICENSE](LICENSE).

Built by David Knuffke. Not affiliated with College Board.
