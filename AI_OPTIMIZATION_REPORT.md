# AI Optimization & Engineering Judgment Report

## 1. Tools & Prompting
*   **Tools Used:** Large Language Models (LLMs) were utilized as pair-programming assistants.
*   **Task Allocation:** Scaffolded the initial Prisma schema, generated standard boilerplate for Next.js App Router API endpoints, and drafted basic Tailwind CSS layouts for the modal interfaces[cite: 10]. Prompting focused on defining clear boundaries (e.g., "Generate a Next.js API route that enforces RBAC using Supabase").

## 2. Flawed/Broken AI Code Identified
*   **Bypassable RBAC Validation:** The AI initially generated UI-level role checks (hiding buttons based on role) but failed to implement server-side JWT validation in the API routes. This would have allowed a `cutting_supervisor` to forge a POST request to approve their own batch[cite: 10].
*   **Contrast & Accessibility Defect:** The initial Tailwind modal generations used `text-gray-400` on `bg-gray-800` for form inputs. This resulted in low contrast that failed the zero-tolerance accessibility mandate[cite: 9, 10].
*   **Client-Side Hard Stop Logic:** The AI placed the GREEN/YELLOW/RED validation entirely inside the React component's `handleSubmit` function. A malicious actor could have bypassed this by hitting the API directly.

## 3. Human Refactoring
*   **Harden Server-Side Security:** I rewrote the Next.js API route (`/api/orders/[id]/verify/route.ts`) to extract the user's role directly from the `supabase.auth.getUser()` server instance. I discarded the AI's client-trusted payload logic and enforced authorization before any database operations occurred[cite: 10].
*   **UI/UX Upgrades:** I manually adjusted the Tailwind utility classes across the application, implementing `bg-slate-950` with high-contrast `text-white` for inputs, and adding explicit focus rings (`focus:ring-blue-500`) to ensure 100% visibility under all states[cite: 9].

## 4. Defensive Architecture
*   **Immutable State Pipeline:** I structured the database using strict Prisma Enums (`OrderStatus` and `ItemStatus`) rather than raw strings to prevent invalid state transitions[cite: 8, 10].
*   **Gatekeeper API Verification:** In the Verification API, I implemented a strict secondary calculation loop. Instead of trusting the client's `GREEN`/`RED` status strings, the server independently recalculates `ActualQty` vs `ExpectedQty` by re-fetching the expected counts from the database[cite: 7]. If `hasShortage` evaluates to true during an `APPROVED` request, the server throws a `422 Unprocessable Entity`[cite: 8].