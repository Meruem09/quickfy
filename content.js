let verifyBtn = null
let sidebar = null
let lastSelectedText = ""
const VERIFY_API_URL = "" // leave blank for now, fill in later (e.g., "https://api.example.com/verify")

function removeVerifyButton() {
  if (verifyBtn) {
    verifyBtn.remove()
    verifyBtn = null
  }
}

function removeSidebar() {
  if (sidebar) {
    sidebar.remove()
    sidebar = null
  }
}

function createVerifyButtonAtSelectionEnd(selection) {
  // Clean up any existing button first
  removeVerifyButton()

  if (!selection || selection.rangeCount === 0) return
  const range = selection.getRangeAt(0)
  const selectedText = selection.toString().trim()
  if (!selectedText) return

  // Use the last rect to approximate "end" of selection for multi-line selections
  const rectList = range.getClientRects()
  const rect = rectList && rectList.length > 0 ? rectList[rectList.length - 1] : range.getBoundingClientRect()

  verifyBtn = document.createElement("button")
  verifyBtn.innerText = "Verify"
  verifyBtn.className = "verify-btn"
  verifyBtn.type = "button"
  verifyBtn.setAttribute("aria-label", "Verify selected text")

  // Position at end of selection (bottom-right) using viewport coordinates
  // Note: for position: fixed, do NOT add scroll offsets.
  const OFFSET = 6
  verifyBtn.style.position = "fixed"
  verifyBtn.style.top = `${rect.bottom + OFFSET}px`
  verifyBtn.style.left = `${rect.right + OFFSET}px`

  document.body.appendChild(verifyBtn)

  lastSelectedText = selectedText

  verifyBtn.onclick = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Optional: remove button after click for clarity
    removeVerifyButton()

    // If no backend URL provided, show a placeholder UI immediately
    if (!VERIFY_API_URL) {
      const placeholder = {
        // Flexible shape; your backend can return any of these fields
        result: "Unknown", // or "True"/"False"
        verdict: "Unknown",
        is_true: null,
        score: null, // 0-100
        legitimacy: null,
        explanation: "Connect a backend to generate a real analysis.",
        truth: "—",
        why_misinfo: "—",
        guidance: "—",
        corrections: [],
        sources: [],
        // echo selected text to show context
        selectedText: lastSelectedText,
      }
      showSidebar(placeholder)
      return
    }

    try {
      const response = await fetch(VERIFY_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lastSelectedText }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      // below is fake data value
      const data = "sknvnvdkvd  backend URL in content.js (VERIFY_API_URL).Failed to verify text. Please configure the backend URL in content.js (VERIFY_API_URL).Failed to verify text. Please configure the backend URL in content.js (VERIFY_API_URL).Failed to verify text. Please configure the backend URL in content.js (VERIFY_API_URL).Failed to verify text. Please configure the backend URL in content.js (VERIFY_API_URL).Failed to verify text. Please configure the backend URL in content.js (VERIFY_API_URL).Failed to verify text. Please configure the backend URL in content.js (VERIFY_API_URL)."
      showSidebar(data)
    } catch (error) {
      console.error("Fetch error:", error)
      // Show an error sidebar with minimal info
      showSidebar({
        result: "Error",
        explanation: "Failed to verify text. Please configure the backend URL in content.js (VERIFY_API_URL).",
        selectedText: lastSelectedText,
      })
    }
  }
}

// Show results in sidebar with flexible parsing
function showSidebar(data) {
  removeSidebar()

  sidebar = document.createElement("div")
  sidebar.className = "verify-sidebar"
  sidebar.setAttribute("role", "dialog")
  sidebar.setAttribute("aria-labelledby", "verifySidebarTitle")
  sidebar.setAttribute("aria-modal", "false")

  // Normalize fields from various potential response shapes
  const verdictRaw = data?.verdict ?? data?.result ?? data?.Result ?? data?.is_true
  let verdict
  if (typeof verdictRaw === "boolean") verdict = verdictRaw ? "True" : "False"
  else if (typeof verdictRaw === "string") verdict = verdictRaw
  else verdict = "Unknown"

  const score = data?.score ?? data?.legitimacy ?? data?.["Score of how true the article is"] ?? null

  const explanation = data?.explanation ?? data?.summary ?? data?.guidance ?? data?.why_misinfo ?? data?.reason ?? "—"

  const truth = data?.truth ?? data?.what_is_true ?? "—"

  const why = data?.why_misinfo ?? data?.why_this_is_spreading ?? "—"

  const corrections = data?.corrections ?? data?.tips ?? []

  const sources = data?.sources ?? (data?.Source ? [data.Source] : [])

  const selectedTextPreview = data?.selectedText ? `<blockquote>${escapeHTML(data.selectedText)}</blockquote>` : ""

  const verdictClass =
    verdict.toLowerCase() === "true"
      ? "badge-true"
      : verdict.toLowerCase() === "false"
        ? "badge-false"
        : "badge-unknown"

  sidebar.innerHTML = `
    <div class="verify-sidebar-header">
      <h3 id="verifySidebarTitle">Verification Result</h3>
      <button id="closeSidebar" aria-label="Close verification sidebar">Close</button>
    </div>

    <div class="verify-sidebar-section">
      <span class="badge ${verdictClass}" aria-live="polite">Verdict: ${escapeHTML(String(verdict))}</span>
      ${score !== null && score !== undefined ? `<div class="score">Score: <strong>${Number(score)}%</strong></div>` : ""}
    </div>

    ${selectedTextPreview}

    <div class="verify-sidebar-section">
      <h4>What is true</h4>
      <p>${escapeHTML(String(truth))}</p>
    </div>

    <div class="verify-sidebar-section">
      <h4>Why misinformation spreads</h4>
      <p>${escapeHTML(String(why))}</p>
    </div>

    <div class="verify-sidebar-section">
      <h4>Guidance</h4>
      <p>${escapeHTML(String(explanation))}</p>
      ${
        Array.isArray(corrections) && corrections.length
          ? `<ul>${corrections.map((c) => `<li>${escapeHTML(String(c))}</li>`).join("")}</ul>`
          : ""
      }
    </div>

    ${
      Array.isArray(sources) && sources.length
        ? `<div class="verify-sidebar-section">
             <h4>Sources</h4>
             <ul>${sources.map((s) => `<li>${renderSource(s)}</li>`).join("")}</ul>
           </div>`
        : ""
    }
  `

  document.body.appendChild(sidebar)

  document.getElementById("closeSidebar").onclick = () => {
    removeSidebar()
  }
}

function renderSource(src) {
  if (typeof src === "string") {
    const safe = escapeHTML(src)
    try {
      const url = new URL(src)
      return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a>`
    } catch {
      return safe
    }
  }
  if (src && typeof src === "object") {
    const label = escapeHTML(String(src.title || src.name || src.url || "Source"))
    const href = escapeHTML(String(src.url || ""))
    if (href) {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
    }
    return label
  }
  return "Source"
}

function escapeHTML(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

// EVENTS

// Show button on mouseup when there is a selection
document.addEventListener("mouseup", () => {
  const selection = window.getSelection()
  const text = selection?.toString().trim() || ""
  if (text) {
    createVerifyButtonAtSelectionEnd(selection)
  } else {
    removeVerifyButton()
  }
})

// Also track selection changes (handles keyboard selection, double-click, etc.)
document.addEventListener("selectionchange", () => {
  const selection = window.getSelection()
  const text = selection?.toString().trim() || ""
  if (!text) {
    removeVerifyButton()
  }
})

// If user clicks elsewhere and selection collapses, remove button
document.addEventListener("mousedown", () => {
  // delay until selection updates
  setTimeout(() => {
    const text = window.getSelection()?.toString().trim() || ""
    if (!text) removeVerifyButton()
  }, 0)
})
