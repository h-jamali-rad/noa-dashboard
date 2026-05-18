/**
 * email-notify.ts
 *
 * Client-side email notification helpers powered by EmailJS.
 *
 * EmailJS lets us send transactional emails directly from the browser
 * (no backend required) — works on Vercel, local dev, and any static host.
 *
 * SETUP (see EMAIL_SETUP_INSTRUCTIONS.md for the full walk-through):
 *   1. Install the SDK:   npm install @emailjs/browser
 *   2. Update the constants below with your EmailJS service ID, template IDs,
 *      and public key.
 *   3. In EmailJS, create two templates with the variable names listed in
 *      EMAIL_SETUP_INSTRUCTIONS.md (template_comment + template_usability).
 *
 * NOTE: All public keys / service IDs in EmailJS are designed to be exposed
 * to the browser. The recipient address is fixed inside the template, so we
 * pass it as a template variable for display only.
 */

import emailjs from '@emailjs/browser'

// ---------------------------------------------------------------------------
// EmailJS configuration — update these to match your EmailJS account.
// ---------------------------------------------------------------------------
export const EMAILJS_CONFIG = {
  /** EmailJS service ID (e.g. "service_xxxxxxx"). */
  serviceId: 'service_j1dhj3h',
  /** Template ID used for comment notifications. */
  commentTemplateId: 'template_comment',
  /** Template ID used for usability / SUS evaluation notifications. */
  usabilityTemplateId: 'template_usability',
  /** EmailJS public key (formerly user ID). */
  publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
  /** Fixed recipient — also set inside each EmailJS template. */
  recipientEmail: 'h.rad.it@gmail.com',
} as const

let initialized = false

/**
 * Lazily initialise the EmailJS SDK exactly once per browser session.
 * Safe to call on every send. No-op on the server (window === undefined).
 */
function ensureInitialized(): boolean {
  if (typeof window === 'undefined') return false
  if (initialized) return true

  try {
    emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey })
    initialized = true
    return true
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[email-notify] EmailJS init failed:', err)
    return false
  }
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type CommentNotificationParams = {
  /** Human-readable article label / title. */
  articleName: string
  /** Stable article ID (used in the dashboard URL). */
  articleId: string
  /** Person who wrote the comment. */
  authorName: string
  /** The exact text the supervisor highlighted in the article. */
  selectedText: string
  /** The supervisor's comment body. */
  commentText: string
  /** Optional ISO timestamp; defaults to now(). */
  timestamp?: string
  /** Optional page URL; defaults to window.location.href. */
  pageUrl?: string
  /** Optional paragraph / section ID for context. */
  paragraphId?: string
}

export type UsabilityNotificationParams = {
  /** Expert evaluator's name. */
  evaluatorName: string
  /** SUS item-level scores. Either a record { Q1: 5, Q2: 4, ... } or an array. */
  susScores: Record<string, number | string> | Array<number | string>
  /** Optional aggregate SUS score (0–100). */
  susTotal?: number | string
  /** Free-form qualitative feedback the evaluator wrote. */
  qualitativeFeedback: string
  /** Optional article context (which article they were reviewing). */
  articleName?: string
  articleId?: string
  /** Optional ISO timestamp; defaults to now(). */
  timestamp?: string
  /** Optional page URL; defaults to window.location.href. */
  pageUrl?: string
}

export type EmailSendResult = {
  ok: boolean
  /** Underlying error (only present when ok === false). */
  error?: unknown
  /** EmailJS HTTP status code, when available. */
  status?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString()
}

function currentPageUrl(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.location.href
  } catch {
    return ''
  }
}

function formatSusScores(
  scores: Record<string, number | string> | Array<number | string> | undefined,
): string {
  if (!scores) return '—'
  try {
    if (Array.isArray(scores)) {
      return scores
        .map((value, idx) => `Q${idx + 1}: ${value ?? '—'}`)
        .join('\n')
    }
    return Object.entries(scores)
      .map(([key, value]) => `${key}: ${value ?? '—'}`)
      .join('\n')
  } catch {
    return String(scores)
  }
}

function truncate(value: string, max = 4000): string {
  if (!value) return ''
  if (value.length <= max) return value
  return `${value.slice(0, max)}… [truncated ${value.length - max} chars]`
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a "new supervisor comment" notification email.
 *
 * Errors are caught and logged. Resolves to { ok: false, error } so callers
 * can branch on it but never need to try/catch.
 */
export async function sendCommentNotification(
  params: CommentNotificationParams,
): Promise<EmailSendResult> {
  if (!ensureInitialized()) {
    return { ok: false, error: new Error('EmailJS not initialised (server-side or init failed)') }
  }

  const timestamp = params.timestamp ?? nowIso()
  const pageUrl = params.pageUrl ?? currentPageUrl()

  const templateParams = {
    // Variable names below must match the EmailJS template fields exactly.
    to_email: EMAILJS_CONFIG.recipientEmail,
    article_name: params.articleName ?? '',
    article_id: params.articleId ?? '',
    author_name: params.authorName ?? '',
    selected_text: truncate(params.selectedText ?? ''),
    comment_text: truncate(params.commentText ?? ''),
    paragraph_id: params.paragraphId ?? '',
    timestamp,
    timestamp_readable: new Date(timestamp).toLocaleString(),
    page_url: pageUrl,
  }

  try {
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.commentTemplateId,
      templateParams,
      { publicKey: EMAILJS_CONFIG.publicKey },
    )
    // eslint-disable-next-line no-console
    console.info('[email-notify] Comment notification sent.', response?.status)
    return { ok: true, status: response?.status }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[email-notify] Failed to send comment notification:', error)
    return { ok: false, error }
  }
}

/**
 * Send a "new usability / SUS evaluation submitted" notification email.
 *
 * Errors are caught and logged. Resolves to { ok: false, error } so callers
 * can branch on it but never need to try/catch.
 */
export async function sendUsabilityNotification(
  params: UsabilityNotificationParams,
): Promise<EmailSendResult> {
  if (!ensureInitialized()) {
    return { ok: false, error: new Error('EmailJS not initialised (server-side or init failed)') }
  }

  const timestamp = params.timestamp ?? nowIso()
  const pageUrl = params.pageUrl ?? currentPageUrl()

  const templateParams = {
    // Variable names below must match the EmailJS template fields exactly.
    to_email: EMAILJS_CONFIG.recipientEmail,
    evaluator_name: params.evaluatorName ?? '',
    sus_scores: formatSusScores(params.susScores),
    sus_total:
      params.susTotal !== undefined && params.susTotal !== null
        ? String(params.susTotal)
        : '—',
    qualitative_feedback: truncate(params.qualitativeFeedback ?? ''),
    article_name: params.articleName ?? '',
    article_id: params.articleId ?? '',
    timestamp,
    timestamp_readable: new Date(timestamp).toLocaleString(),
    page_url: pageUrl,
  }

  try {
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.usabilityTemplateId,
      templateParams,
      { publicKey: EMAILJS_CONFIG.publicKey },
    )
    // eslint-disable-next-line no-console
    console.info('[email-notify] Usability notification sent.', response?.status)
    return { ok: true, status: response?.status }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[email-notify] Failed to send usability notification:', error)
    return { ok: false, error }
  }
}
