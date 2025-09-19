let verifyBtn = null;
let lastSelectedText = "";

function getPublishedDate() {
  const metaSelectors = [
    'meta[property="article:published_time"]',
    'meta[property="og:published_time"]',
    'meta[name="publish_date"]',
    'meta[name="pubdate"]',
    'meta[name="date"]',
    'meta[name="dc.date"]',
    'meta[name="dcterms.date"]',
    'meta[property="og:article:published_time"]'
  ];

  for (const selector of metaSelectors) {
    const meta = document.querySelector(selector);
    if (meta) {
      const date = meta.getAttribute('content');
      if (date && /^\d{4}-\d{2}-\d{2}/.test(date)) {
        return date;
      }
    }
  }

  const timeElems = document.querySelectorAll('time[datetime], time[pubdate]');
  for (const elem of timeElems) {
    const date = elem.getAttribute('datetime') || elem.getAttribute('pubdate');
    if (date && /^\d{4}-\d{2}-\d{2}/.test(date)) {
      return date;
    }
  }

  console.warn('No published date found in metadata.');
  return '';
}

function removeVerifyButton() {
  if (verifyBtn) {
    verifyBtn.remove();
    verifyBtn = null;
  }
}

function createVerifyButtonAtSelectionEnd(selection) {
  removeVerifyButton();

  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const selectedText = selection.toString().trim();
  if (!selectedText) return;

  const rectList = range.getClientRects();
  const rect = rectList && rectList.length > 0 ? rectList[rectList.length - 1] : range.getBoundingClientRect();

  verifyBtn = document.createElement("button");
  verifyBtn.innerText = "Verify";
  verifyBtn.className = "verify-btn";
  verifyBtn.type = "button";
  verifyBtn.setAttribute("aria-label", "Verify selected text");

  const OFFSET = 6;
  verifyBtn.style.position = "fixed";
  verifyBtn.style.top = `${rect.bottom + OFFSET}px`;
  verifyBtn.style.left = `${rect.right + OFFSET}px`;

  document.body.appendChild(verifyBtn);

  lastSelectedText = selectedText;

  verifyBtn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    removeVerifyButton();

    const published_date = getPublishedDate();

    chrome.runtime.sendMessage({
      action: "verifyText",
      text: lastSelectedText,
      source: "content",
      date: published_date
    });
  };
}

document.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  const text = selection?.toString().trim() || "";
  if (text) {
    createVerifyButtonAtSelectionEnd(selection);
  } else {
    removeVerifyButton();
  }
});

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  const text = selection?.toString().trim() || "";
  if (!text) {
    removeVerifyButton();
  }
});

document.addEventListener("mousedown", () => {
  setTimeout(() => {
    const text = window.getSelection()?.toString().trim() || "";
    if (!text) removeVerifyButton();
  }, 0);
});