// @vitest-environment jsdom
import { describe, expect, it } from "vitest"

import {
  isValidLinkUrl,
  looksLikeHtml,
  plainTextToHtml,
  sanitizeHtml,
} from "../sanitize-html"

describe("sanitizeHtml", () => {
  it("keeps the tags produced by the rich text editor", () => {
    const html =
      "<h2>Title</h2><p><strong>Bold</strong> <em>italic</em> <u>underline</u> <s>strike</s></p><ul><li>One</li></ul><ol><li>Two</li></ol><blockquote><p>Quote</p></blockquote>"

    expect(sanitizeHtml(html)).toEqual(html)
  })

  it("strips script tags and event handlers", () => {
    expect(sanitizeHtml("<p>ok</p><script>alert(1)</script>")).toEqual(
      "<p>ok</p>"
    )
    expect(sanitizeHtml(`<img src="x" onerror="alert(1)">`)).toEqual("")
    expect(sanitizeHtml(`<p onclick="alert(1)">ok</p>`)).toEqual("<p>ok</p>")
  })

  it("strips disallowed tags but keeps their text content", () => {
    expect(sanitizeHtml("<div><span>ok</span></div>")).toEqual("ok")
    expect(sanitizeHtml("<h1>Title</h1>")).toEqual("Title")
  })

  it("removes javascript: and data: hrefs", () => {
    expect(sanitizeHtml(`<a href="javascript:alert(1)">x</a>`)).not.toContain(
      "javascript:"
    )
    expect(
      sanitizeHtml(`<a href="data:text/html;base64,x">x</a>`)
    ).not.toContain("data:")
  })

  it("forces safe rel and target on links", () => {
    const result = sanitizeHtml(`<a href="https://example.com">x</a>`)

    expect(result).toContain(`href="https://example.com"`)
    expect(result).toContain(`target="_blank"`)
    expect(result).toContain(`rel="noopener noreferrer nofollow"`)
  })

  it("returns an empty string for empty input", () => {
    expect(sanitizeHtml("")).toEqual("")
  })
})

describe("looksLikeHtml", () => {
  it("detects markup", () => {
    expect(looksLikeHtml("<p>hello</p>")).toBe(true)
    expect(looksLikeHtml("hello world")).toBe(false)
    expect(looksLikeHtml("a < b and b > a")).toBe(false)
  })
})

describe("plainTextToHtml", () => {
  it("converts lines to paragraphs and escapes markup", () => {
    expect(plainTextToHtml("one\ntwo")).toEqual("<p>one</p><p>two</p>")
    expect(plainTextToHtml("a <b> & c")).toEqual("<p>a &lt;b&gt; &amp; c</p>")
    expect(plainTextToHtml("")).toEqual("")
  })
})

describe("isValidLinkUrl", () => {
  it("accepts http(s) URLs only", () => {
    expect(isValidLinkUrl("https://example.com")).toBe(true)
    expect(isValidLinkUrl("http://example.com/a?b=c")).toBe(true)
    expect(isValidLinkUrl("javascript:alert(1)")).toBe(false)
    expect(isValidLinkUrl("ftp://example.com")).toBe(false)
    expect(isValidLinkUrl("example.com")).toBe(false)
  })
})
