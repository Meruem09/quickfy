const VERIFY_API_URL = "https://niraj007.app.n8n.cloud/webhook-test/1f483e84-6430-49e9-8e99-29c14faedd72";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Text Verifier installed!");
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id })
    .then(() => {
      chrome.runtime.sendMessage({
        action: "displayVerificationResult",
        data: {
          result: "Info",
          explanation: "Select text on the page and click 'Verify', or enter text below to check its accuracy.",
          selectedText: ""
        }
      });
    })
    .catch((error) => {
      console.error("Error opening side panel:", error);
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openSidePanel" && sender.tab?.id) {
    chrome.sidePanel.open({ tabId: sender.tab.id })
      .then(() => {
        chrome.runtime.sendMessage({
          action: "displayVerificationResult",
          data: message.data
        });
      })
      .catch((error) => {
        console.error("Error opening side panel:", error);
      });
  } else if (message.action === "verifyText") {
    // Handle text verification from the side panel input
    const published_date = message.source === "panel" ? "" : getPublishedDateFromTab(sender.tab.id);
    const text = message.text;

    if (!VERIFY_API_URL) {
      chrome.runtime.sendMessage({
        action: "displayVerificationResult",
        data: {
          result: "Unknown",
          explanation: "Connect a backend to generate a real analysis.",
          selectedText: text
        }
      });
      return;
    }

    // Perform API request
    const params = new URLSearchParams({
      text: text,
      date: published_date
    });
    const urlWithParams = `${VERIFY_API_URL}?${params.toString()}`;

    fetch(urlWithParams, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        chrome.runtime.sendMessage({
          action: "displayVerificationResult",
          data: { ...data, selectedText: text }
        });
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        chrome.runtime.sendMessage({
          action: "displayVerificationResult",
          data: {
            result: "Error",
            explanation: "Failed to verify text. Please check the backend URL.",
            selectedText: text
          }
        });
      });
  }
});

// Helper function to get published date by injecting content script (for panel input)
function getPublishedDateFromTab(tabId) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
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
        return "";
      }
    }, (results) => {
      resolve(results[0]?.result || "");
    });
  });
}