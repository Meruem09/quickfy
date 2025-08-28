let verifyBtn = null;
let sidebar = null;

// Function to remove the verify button
function removeVerifyButton() {
  if (verifyBtn) {
    verifyBtn.remove();
    verifyBtn = null;
  }
}

// Detect text selection changes
document.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  // Remove any existing button first
  removeVerifyButton();

  if (selectedText.length > 0 && selection.rangeCount > 0) {
    // Create floating button
    verifyBtn = document.createElement("button");
    verifyBtn.innerText = "Verify";
    verifyBtn.className = "verify-btn";

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    // Position button to the right of the selected text
    verifyBtn.style.position = "fixed";
    verifyBtn.style.top = `${rect.top + window.scrollY}px`; // Align with top of selection
    verifyBtn.style.left = `${rect.right + window.scrollX + 5}px`; // 5px right of selection

    document.body.appendChild(verifyBtn);

    verifyBtn.onclick = async () => {
      try {
        // Send text to backend
        const response = await fetch("http://localhost:5000/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: selectedText })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        showSidebar(data);
      } catch (error) {
        console.error("Fetch error:", error);
        alert("Failed to verify text. Is the backend server running?");
      }
    };
  }
});

// Remove button when clicking elsewhere (deselecting text)
document.addEventListener("mousedown", (event) => {
  // Delay to check selection after mousedown
  setTimeout(() => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length === 0) {
      removeVerifyButton();
    }
  }, 0);
});

// Show results in sidebar
function showSidebar(data) {
  if (sidebar) sidebar.remove();

  sidebar = document.createElement("div");
  sidebar.className = "verify-sidebar";

  // Parse JSON into readable format
  sidebar.innerHTML = `
    <h3>Verification Result</h3>
    <p><b>Result:</b> ${data.Result}</p>
    <p><b>Truth Score:</b> ${data["Score of how true the article is"]}</p>
    <p><b>Source:</b> ${data.Source}</p>
    <button id="closeSidebar">Close</button>
  `;

  document.body.appendChild(sidebar);

  document.getElementById("closeSidebar").onclick = () => {
    sidebar.remove();
    sidebar = null;
  };
}