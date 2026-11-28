/**
 * Safe Plain-Text & Minimal Markdown Formatter for Chat Replies
 * Supports ONLY paragraphs, **bold**, and "- " bullet lists.
 * Never uses innerHTML; raw HTML, links, images, and scripts render as inert text.
 */

/**
 * Appends inline text with **bold** spans using text nodes only.
 * @param {HTMLElement} parent
 * @param {string} line
 */
function appendInlineFormatted(parent, line) {
  const re = /\*\*([^*]+)\*\*/g;
  let lastIdx = 0;
  let match;
  while ((match = re.exec(line)) !== null) {
    if (match.index > lastIdx) {
      parent.appendChild(document.createTextNode(line.slice(lastIdx, match.index)));
    }
    const strong = document.createElement('strong');
    strong.textContent = match[1];
    parent.appendChild(strong);
    lastIdx = re.lastIndex;
  }
  if (lastIdx < line.length) {
    parent.appendChild(document.createTextNode(line.slice(lastIdx)));
  }
}

/**
 * Converts assistant text into safe DOM nodes (paragraphs + "- " bullet lists + **bold**).
 * @param {string} rawText
 * @returns {DocumentFragment}
 */
export function formatAssistantText(rawText) {
  const frag = document.createDocumentFragment();
  const lines = String(rawText || '').split(/\r?\n/);
  let currentList = null;
  let paraLines = [];

  const flushPara = () => {
    if (paraLines.length === 0) return;
    const p = document.createElement('p');
    p.style.fontSize = 'var(--font-size-sm)';
    appendInlineFormatted(p, paraLines.join(' '));
    frag.appendChild(p);
    paraLines = [];
  };

  const flushList = () => {
    if (!currentList) return;
    frag.appendChild(currentList);
    currentList = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushPara();
      flushList();
    } else if (line.startsWith('- ')) {
      flushPara();
      if (!currentList) {
        currentList = document.createElement('ul');
        currentList.style.paddingLeft = '1.25rem';
        currentList.style.marginBottom = 'var(--space-2)';
        currentList.style.fontSize = 'var(--font-size-sm)';
      }
      const li = document.createElement('li');
      appendInlineFormatted(li, line.slice(2));
      currentList.appendChild(li);
    } else {
      flushList();
      paraLines.push(line);
    }
  }
  flushPara();
  flushList();
  return frag;
}
