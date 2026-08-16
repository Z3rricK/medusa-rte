import DOMPurify from "dompurify"

/**
 * Tags and attributes that match the feature set of the rich text editor
 * used for product descriptions. Anything outside this allowlist is
 * stripped, both when the editor emits HTML and when stored HTML is
 * rendered (e.g. values that entered the field via CSV import and never
 * passed through the editor).
 */
const ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "a",
  "br",
]

const ALLOWED_ATTR = ["href", "target", "rel"]

/**
 * Only allow http(s) URLs in href attributes. Mirrors the `safeHttpUrl`
 * validator used by the API, which rejects schemes such as `javascript:`,
 * `data:`, and `vbscript:` that can lead to stored XSS when rendered.
 */
const ALLOWED_URI_REGEXP = /^https?:/i

let hooksRegistered = false

const registerHooks = () => {
  if (hooksRegistered) {
    return
  }

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank")
      node.setAttribute("rel", "noopener noreferrer nofollow")
    }
  })

  hooksRegistered = true
}

export const sanitizeHtml = (html: string): string => {
  if (!html) {
    return ""
  }

  registerHooks()

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
  })
}

export const looksLikeHtml = (value: string): boolean => {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/**
 * Converts legacy plain text descriptions to HTML, preserving line breaks
 * as paragraphs so they are not collapsed when loaded into the editor.
 */
export const plainTextToHtml = (value: string): string => {
  if (!value) {
    return ""
  }

  return value
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("")
}

export const isValidLinkUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}
