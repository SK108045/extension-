(() => {
  "use strict";

  // Display-only experiment: never sends requests or changes stored account data.
  const TARGET_SURPLUS = 7000;
  const LABELS = ["TOTAL BILLED", "TOTAL PAID", "BALANCE"];
  const KSH_REGEX = /\bKsh\.?\s*(-?\s*[\d,]+(?:\.\d{1,2})?)/i;
  const ALL_LABELS_REGEX = /TOTAL\s+BILLED|TOTAL\s+PAID|BALANCE/i;
  const normalize = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toUpperCase();

  function findCard(label) {
    const wanted = normalize(label);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (normalize(node.nodeValue).replace(/:$/, "") !== wanted) continue;
      let element = node.parentElement;
      for (let i = 0; i < 9 && element && element !== document.body; i++, element = element.parentElement) {
        const text = normalize(element.textContent);
        if (!text.includes(wanted) || !KSH_REGEX.test(text)) continue;
        if (LABELS.some((other) => other !== label && text.includes(other))) continue;
        return element;
      }
    }
    return null;
  }

  function readAmount(card) {
    if (!card) return null;
    const match = card.textContent.match(KSH_REGEX);
    if (!match) return null;
    const value = Number(match[1].replace(/\s|,/g, ""));
    return Number.isFinite(value) ? value : null;
  }

  function formatAmount(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  function replaceAmount(card, value) {
    if (!card) return false;
    const current = readAmount(card);
    if (current === null || current === value) return false;
    const display = formatAmount(value);
    const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    let node;

    // Replace just the text leaf, preserving the portal's existing styles and icons.
    while ((node = walker.nextNode())) {
      const valueText = node.nodeValue;
      if (!KSH_REGEX.test(valueText)) continue;
      node.nodeValue = valueText.replace(KSH_REGEX, (whole, amountPart) =>
        whole.slice(0, whole.length - amountPart.length) + display
      );
      return true;
    }

    // Handles portals that render the currency prefix and digits separately.
    const possibleText = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    while ((node = possibleText.nextNode())) {
      const text = node.nodeValue;
      if (!/\d/.test(text) || ALL_LABELS_REGEX.test(text)) continue;
      const match = text.match(/-?\s*[\d,]+(?:\.\d{1,2})?/);
      if (match && Number(match[0].replace(/\s|,/g, "")) === current) {
        node.nodeValue = text.replace(match[0], display);
        return true;
      }
    }

    const smallest = [...card.querySelectorAll("*")].reverse()
      .find((el) => KSH_REGEX.test(el.textContent));
    if (smallest) {
      smallest.textContent = smallest.textContent.replace(KSH_REGEX, "Ksh. " + display);
      return true;
    }
    return false;
  }

  function showLocalTestNotice() {
    if (document.getElementById("msu-local-test-notice")) return;
    const notice = document.createElement("div");
    notice.id = "msu-local-test-notice";
    notice.setAttribute("role", "status");
    notice.textContent = "LOCAL TEST VIEW — DISPLAYED FIGURES ARE NOT OFFICIAL";
    Object.assign(notice.style, {
      position: "fixed",
      bottom: "14px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "2147483647",
      background: "#171717",
      color: "#fff",
      border: "2px solid #facc15",
      borderRadius: "8px",
      padding: "10px 16px",
      boxShadow: "0 5px 24px rgba(0,0,0,.35)",
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
      fontWeight: "700",
      textAlign: "center",
      maxWidth: "calc(100vw - 20px)"
    });
    document.body.appendChild(notice);
  }

  function updateDashboard() {
    const paid = findCard("TOTAL PAID");
    const billed = findCard("TOTAL BILLED");
    const balance = findCard("BALANCE");
    if (!paid || !billed || !balance) return;

    const amountPaid = readAmount(paid);
    if (amountPaid === null) return;

    replaceAmount(billed, amountPaid - TARGET_SURPLUS);
    replaceAmount(balance, TARGET_SURPLUS);
    showLocalTestNotice();
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      updateDashboard();
    });
  });

  updateDashboard();
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
