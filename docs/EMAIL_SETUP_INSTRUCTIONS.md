# EmailJS Setup — Noa Dashboard Comment Notifications

This guide walks you through wiring **client-side email notifications** to the
Noa dashboard's comment & SUS-evaluation flow using **EmailJS**.

EmailJS sends transactional emails directly from the browser using your own
Gmail (or other provider) account — **no backend required**. It works in
local dev and on Vercel out of the box.

> Recipient address used by this project: **`h.rad.it@gmail.com`**

---

### 1. Install the SDK

From the dashboard project root:

```bash
npm install @emailjs/browser
# or
yarn add @emailjs/browser
# or
pnpm add @emailjs/browser
```

The helper module `shared/email-notify.ts` already imports it as
`import emailjs from '@emailjs/browser'`.

---

### 2. Create an EmailJS account

1. Go to <https://www.emailjs.com/> and click **Sign Up** (free tier is fine —
   200 emails / month).
2. Verify your email address and log in to the dashboard.

---

### 3. Create an email service (Gmail recommended)

1. In the EmailJS dashboard, open **Email Services → Add New Service**.
2. Choose **Gmail** (recommended) — or another provider if you prefer.
3. Click **Connect Account** and authorise EmailJS to send mail on behalf of
   the Gmail account that will appear in the **From** field.
   *Tip:* if you want emails to come from a generic "Noa Dashboard"
   mailbox, sign in with that mailbox now.
4. Set the **Service ID** to: `service_noa_dashboard`
   - If EmailJS auto-generates a different ID (e.g. `service_abc123`), you
     can either rename it here or update `EMAILJS_CONFIG.serviceId` in
     `shared/email-notify.ts` to match.
5. Click **Create Service**.

---

### 4. Create the two email templates

You need **two** templates: one for new comments, one for SUS / usability
submissions. **The template variable names must match exactly** what the
code sends — they are listed below in *italics*.

#### 4a. Template: `template_comment`

1. **Email Templates → Create New Template**.
2. Set the **Template ID** to `template_comment` (left sidebar → Settings).
3. **Settings → To Email**: set to `{{to_email}}` (or hard-code
   `h.rad.it@gmail.com`).
4. **Settings → From Name**: e.g. `Noa Dashboard`.
5. **Settings → Subject**:
   ```
   New supervisor comment on {{article_name}}
   ```
6. **Content → HTML body** (or Plain text):
   ```html
   <h2>New supervisor comment</h2>
   <p><strong>Article:</strong> {{article_name}} ({{article_id}})</p>
   <p><strong>Author:</strong> {{author_name}}</p>
   <p><strong>When:</strong> {{timestamp_readable}} ({{timestamp}})</p>
   <p><strong>Page:</strong> <a href="{{page_url}}">{{page_url}}</a></p>
   <p><strong>Paragraph ID:</strong> {{paragraph_id}}</p>

   <h3>Selected text</h3>
   <blockquote>{{selected_text}}</blockquote>

   <h3>Comment</h3>
   <p>{{comment_text}}</p>
   ```
7. **Save** the template.

Variables the code sends to this template (all required to exist in the
template — unused ones are simply ignored):

| Variable              | Description                                    |
| --------------------- | ---------------------------------------------- |
| `to_email`            | Recipient email (`h.rad.it@gmail.com`)         |
| `article_name`        | Human-readable article label / title           |
| `article_id`          | Stable article ID                              |
| `author_name`         | Person who wrote the comment                   |
| `selected_text`       | Highlighted text the comment refers to         |
| `comment_text`        | The comment body                               |
| `paragraph_id`        | Paragraph ID where the selection was made      |
| `timestamp`           | ISO-8601 timestamp                             |
| `timestamp_readable`  | Local-formatted timestamp                      |
| `page_url`            | URL of the article page in the browser         |

#### 4b. Template: `template_usability`

1. **Email Templates → Create New Template**.
2. Set the **Template ID** to `template_usability`.
3. **Settings → To Email**: `{{to_email}}` (or hard-code `h.rad.it@gmail.com`).
4. **Settings → From Name**: `Noa Dashboard`.
5. **Settings → Subject**:
   ```
   New SUS evaluation submitted by {{evaluator_name}}
   ```
6. **Content → HTML body**:
   ```html
   <h2>New SUS / usability evaluation submitted</h2>
   <p><strong>Evaluator:</strong> {{evaluator_name}}</p>
   <p><strong>When:</strong> {{timestamp_readable}} ({{timestamp}})</p>
   <p><strong>Article:</strong> {{article_name}} ({{article_id}})</p>
   <p><strong>Page:</strong> <a href="{{page_url}}">{{page_url}}</a></p>

   <h3>SUS scores</h3>
   <pre>{{sus_scores}}</pre>
   <p><strong>Total SUS:</strong> {{sus_total}}</p>

   <h3>Qualitative feedback</h3>
   <p>{{qualitative_feedback}}</p>
   ```
7. **Save** the template.

Variables sent by the code:

| Variable               | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `to_email`             | Recipient (`h.rad.it@gmail.com`)                      |
| `evaluator_name`       | Expert evaluator's name                               |
| `sus_scores`           | Per-item SUS scores, newline-separated `Q1: 5` etc.   |
| `sus_total`            | Aggregate SUS score (0–100), or `—`                   |
| `qualitative_feedback` | Free-form feedback text                               |
| `article_name`         | Optional — article being evaluated                    |
| `article_id`           | Optional — article ID                                 |
| `timestamp`            | ISO-8601 timestamp                                    |
| `timestamp_readable`   | Local-formatted timestamp                             |
| `page_url`             | URL the evaluator submitted from                      |

---

### 5. Grab your public key

1. In the EmailJS dashboard, open **Account → General** (or
   **Account → API Keys** on newer dashboards).
2. Copy the **Public Key** (looks like `abcDEF12345gHIjKL`).
3. *(The "Private Key" is NOT used in this project — it's only for
   server-side / non-browser usage.)*

---

### 6. Update the config in code

Open `shared/email-notify.ts` and update the `EMAILJS_CONFIG` block at the
top of the file:

```ts
export const EMAILJS_CONFIG = {
  serviceId: 'service_noa_dashboard',          // ← step 3
  commentTemplateId: 'template_comment',       // ← step 4a
  usabilityTemplateId: 'template_usability',   // ← step 4b
  publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',        // ← step 5 — REPLACE THIS
  recipientEmail: 'h.rad.it@gmail.com',
} as const
```

> Only `publicKey` *must* be changed. The other IDs already match the
> recommended names — if you used different IDs in EmailJS, change them
> here too.

**Optional — use environment variables instead** (Next.js):

```ts
publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? 'YOUR_EMAILJS_PUBLIC_KEY',
```

then add to `.env.local` (and Vercel env vars):

```
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=abcDEF12345gHIjKL
```

`NEXT_PUBLIC_` prefix is required so the value is exposed to the browser.
EmailJS public keys are designed to be exposed publicly — that is safe.

---

### 7. Swap the component over

The integration lives in `shared/article-preview-client-updated.tsx`. Once
you're happy, replace the original:

```bash
# from the project root
mv shared/article-preview-client.tsx shared/article-preview-client.backup.tsx
mv shared/article-preview-client-updated.tsx shared/article-preview-client.tsx
```

…or simply review the diff and copy the two added blocks into your
existing file.

---

### 8. Testing

#### Local

1. `npm run dev` (or your project's dev command).
2. Open any article page in the dashboard.
3. Select text → write a comment → click **Save Comment**.
4. Check the browser DevTools **Console** — you should see
   `[email-notify] Comment notification sent. 200`.
5. Check the inbox at `h.rad.it@gmail.com`.

#### Common gotchas

- **403 / "Public Key is invalid"** — you pasted the *private* key, or the
  key has not been activated. Re-copy from EmailJS dashboard.
- **412 / "Insufficient permissions"** — your Gmail connection in EmailJS
  expired. Reconnect the service.
- **No email arrives but console shows 200** — check the Gmail account's
  **Spam** folder; also confirm the template's "To Email" actually
  resolves (you can preview a template send from the EmailJS dashboard).
- **Nothing at all in the console** — make sure
  `@emailjs/browser` is installed and the dev server was restarted.

#### Sanity-check from the browser console

You can manually trigger a send to verify everything wires up:

```js
import('./shared/email-notify').then(m =>
  m.sendCommentNotification({
    articleName: 'Manual test',
    articleId: 'test-001',
    authorName: 'Tester',
    selectedText: 'lorem ipsum',
    commentText: 'manual test from devtools',
  }).then(console.log)
)
```

---

### 9. Production / Vercel notes

- Add `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` to your Vercel project's **Environment
  Variables** (Production + Preview + Development).
- Redeploy.
- EmailJS allows you to lock the public key to specific domains in
  **Account → Security** — recommended once you know your production
  domain.
- The free tier is 200 emails/month. If you expect more, upgrade in
  EmailJS billing.

---

### 10. Files added by this integration

| File                                              | Purpose                                              |
| ------------------------------------------------- | ---------------------------------------------------- |
| `shared/email-notify.ts`                          | Reusable EmailJS helper + config + send functions    |
| `shared/article-preview-client-updated.tsx`       | Updated component with email hook on comment save    |
| `shared/EMAIL_SETUP_INSTRUCTIONS.md`              | This document                                        |

Email is **purely additive** — comments still save via `/api/comments` and
the localStorage fallback exactly as before; the email is sent after a
successful save and any send failure is logged but never blocks the user.
