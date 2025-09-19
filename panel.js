function escapeHTML(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSource(src) {
  if (typeof src === "string") {
    const safe = escapeHTML(src);
    try {
      const url = new URL(src);
      return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a>`;
    } catch {
      return safe;
    }
  }
  if (src && typeof src === "object") {
    const label = escapeHTML(String(src.title || src.name || src.url || "Source"));
    const href = escapeHTML(String(src.url || ""));
    if (href) {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    }
    return label;
  }
  return "Source";
}

function renderVerificationResult(data) {
  const sidebarContent = document.getElementById("sidebarContent");
  const verdictRaw = data?.verdict ?? data?.result ?? data?.Result ?? data?.is_true;
  let verdict;
  if (typeof verdictRaw === "boolean") verdict = verdictRaw ? "True" : "False";
  else if (typeof verdictRaw === "string") verdict = verdictRaw;
  else verdict = "Unknown";

  const score = data?.score ?? data?.legitimacy ?? data?.["Score of how true the article is"] ?? null;
  const explanation = data?.explanation ?? data?.summary ?? data?.guidance ?? data?.why_misinfo ?? data?.reason ?? "—";
  const truth = data?.truth ?? data?.what_is_true ?? "—";
  const why = data?.why_misinfo ?? data?.why_this_is_spreading ?? "—";
  const corrections = data?.corrections ?? data?.tips ?? [];
  const sources = data?.sources ?? (data?.Source ? [data.Source] : []);
  const selectedTextPreview = data?.selectedText ? `<blockquote>${escapeHTML(data.selectedText)}</blockquote>` : "";

  const verdictClass =
    verdict.toLowerCase() === "true"
      ? "badge-true"
      : verdict.toLowerCase() === "false"
        ? "badge-false"
        : "badge-unknown";

  sidebarContent.innerHTML = `
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
  `;
}

// Initialize with default message
renderVerificationResult({
  result: "Info",
  explanation: "Select text on the page and click 'Verify', or enter text below to check its accuracy.",
  selectedText: ""
});

// Listen for verification results from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "displayVerificationResult") {
    renderVerificationResult(message.data);
  }
});

// Handle input field submission
document.getElementById("verifyInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const text = e.target.value.trim();
    if (text) {
      chrome.runtime.sendMessage({
        action: "verifyText",
        text: text,
        source: "panel"
      });
      e.target.value = ""; // Clear input after submission
    }
  }
});