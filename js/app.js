import {
  GUESTBOOK_CONFIG
} from "./config.js";


const titleElement =
  document.getElementById("guestbookTitle");

const totalCount =
  document.getElementById("totalCount");

const lastUpdated =
  document.getElementById("lastUpdated");

const loadingState =
  document.getElementById("loadingState");

const errorState =
  document.getElementById("errorState");

const emptyState =
  document.getElementById("emptyState");

const retryLoadButton =
  document.getElementById("retryLoadButton");

const grid =
  document.getElementById("guestbookGrid");

const loadMoreButton =
  document.getElementById("loadMoreButton");

const viewerModal =
  document.getElementById("viewerModal");

const viewerBackdrop =
  document.getElementById("viewerBackdrop");

const viewerCloseButton =
  document.getElementById("viewerCloseButton");

const viewerFrame =
  document.getElementById("viewerFrame");

const viewerMessage =
  document.getElementById("viewerMessage");


const entriesBySequence =
  new Map();

let currentOffset = 0;
let hasMore = false;
let maxSequence = 0;
let refreshTimer = null;
let loadingMore = false;


function isConfigured() {
  return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/i.test(
    String(GUESTBOOK_CONFIG.webAppUrl || "")
  );
}


function jsonp(params) {
  return new Promise((resolve, reject) => {
    const callbackName =
      `__guestbookList_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const script =
      document.createElement("script");

    const timeoutId =
      window.setTimeout(() => {
        cleanup();
        reject(new Error("JSONP_TIMEOUT"));
      }, 8000);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      try {
        delete window[callbackName];
      }
      catch (_) {
        window[callbackName] = undefined;
      }
      script.remove();
    };

    window[callbackName] = data => {
      cleanup();
      resolve(data);
    };

    const url =
      new URL(GUESTBOOK_CONFIG.webAppUrl);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    url.searchParams.set("callback", callbackName);
    url.searchParams.set("_", String(Date.now()));

    script.src = url.toString();
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error("JSONP_NETWORK_ERROR"));
    };

    document.head.appendChild(script);
  });
}


function makeCard(entry) {
  const article =
    document.createElement("article");
  article.className = "guestbook-card";
  article.dataset.sequence = String(entry.sequence);

  const mediaButton =
    document.createElement("button");
  mediaButton.type = "button";
  mediaButton.className = "guestbook-media-button";
  mediaButton.setAttribute(
    "aria-label",
    `${entry.sequence}번째 방명록 사진 크게 보기`
  );

  const frame =
    document.createElement("iframe");
  frame.className = "guestbook-media-frame";
  frame.src = entry.mediaUrl;
  frame.title = `${entry.sequence}번째 방명록 사진`;
  frame.loading = "lazy";
  frame.tabIndex = -1;

  mediaButton.appendChild(frame);
  mediaButton.addEventListener(
    "click",
    () => openViewer(entry)
  );

  const body =
    document.createElement("div");
  body.className = "guestbook-card-body";

  const meta =
    document.createElement("div");
  meta.className = "guestbook-card-meta";

  const sequence =
    document.createElement("span");
  sequence.className = "guestbook-sequence";
  sequence.textContent = `#${String(entry.sequence).padStart(3, "0")}`;

  const type =
    document.createElement("span");
  type.className = "guestbook-type";
  type.textContent = entry.mediaType === "gif" ? "GIF" : "PNG";

  meta.append(sequence, type);

  const message =
    document.createElement("p");
  message.className = "guestbook-message";
  message.textContent = entry.message || "함께 남긴 과학의 순간";

  const time =
    document.createElement("p");
  time.className = "guestbook-time";
  time.textContent = formatDate(entry.createdAt);

  body.append(meta, message, time);
  article.append(mediaButton, body);

  return article;
}


function addEntries(entries, { prepend = false } = {}) {
  const fragment =
    document.createDocumentFragment();

  const fresh = [];

  entries.forEach(entry => {
    const sequence = Number(entry.sequence) || 0;
    if (!sequence || entriesBySequence.has(sequence)) {
      return;
    }

    entriesBySequence.set(sequence, entry);
    maxSequence = Math.max(maxSequence, sequence);
    fresh.push(entry);
  });

  if (prepend) {
    fresh.reverse();
  }

  fresh.forEach(entry => {
    fragment.appendChild(makeCard(entry));
  });

  if (prepend && grid.firstChild) {
    grid.insertBefore(fragment, grid.firstChild);
  }
  else {
    grid.appendChild(fragment);
  }
}


async function initialLoad() {
  if (!isConfigured()) {
    loadingState.classList.add("hidden");
    errorState.classList.remove("hidden");
    errorState.querySelector("p").textContent =
      "guestbook-site/js/config.js에 Google Apps Script 웹 앱 주소를 입력해 주세요.";
    return;
  }

  loadingState.classList.remove("hidden");
  errorState.classList.add("hidden");
  emptyState.classList.add("hidden");

  try {
    const data = await jsonp({
      action: "list",
      order: GUESTBOOK_CONFIG.order,
      limit: GUESTBOOK_CONFIG.pageSize,
      offset: 0
    });

    if (!data || data.ok === false) {
      throw new Error(data?.error || "LIST_FAILED");
    }

    grid.replaceChildren();
    entriesBySequence.clear();
    maxSequence = 0;
    currentOffset = data.entries.length;
    hasMore = Boolean(data.hasMore);

    addEntries(data.entries);
    updateSummary(data.publishedTotal ?? data.total ?? data.entries.length);
    updateStates();
    scheduleRefresh();
  }
  catch (error) {
    console.error(error);
    loadingState.classList.add("hidden");
    errorState.classList.remove("hidden");
  }
}


async function loadMore() {
  if (loadingMore || !hasMore) {
    return;
  }

  loadingMore = true;
  loadMoreButton.disabled = true;
  loadMoreButton.textContent = "불러오는 중...";

  try {
    const data = await jsonp({
      action: "list",
      order: GUESTBOOK_CONFIG.order,
      limit: GUESTBOOK_CONFIG.pageSize,
      offset: currentOffset
    });

    if (!data || data.ok === false) {
      throw new Error(data?.error || "LIST_FAILED");
    }

    addEntries(data.entries);
    currentOffset += data.entries.length;
    hasMore = Boolean(data.hasMore);
    updateSummary(data.publishedTotal ?? data.total ?? entriesBySequence.size);
    updateStates();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    loadingMore = false;
    loadMoreButton.disabled = false;
    loadMoreButton.textContent = "이전 사진 더 보기";
  }
}


async function pollNewEntries() {
  if (!isConfigured()) {
    return;
  }

  try {
    const data = await jsonp({
      action: "list",
      order: "asc",
      limit: 60,
      afterSequence: maxSequence
    });

    if (!data || data.ok === false) {
      return;
    }

    if (data.entries.length > 0) {
      const prepend =
        String(GUESTBOOK_CONFIG.order || "desc").toLowerCase() === "desc";

      addEntries(data.entries, { prepend });
      currentOffset += data.entries.length;
    }

    updateSummary(data.publishedTotal ?? entriesBySequence.size);
    updateStates();
  }
  catch (error) {
    console.warn("방명록 자동 새로고침 실패:", error);
  }
}


function updateStates() {
  loadingState.classList.add("hidden");
  errorState.classList.add("hidden");

  emptyState.classList.toggle(
    "hidden",
    entriesBySequence.size > 0
  );

  loadMoreButton.classList.toggle(
    "hidden",
    !hasMore
  );
}


function updateSummary(total) {
  totalCount.textContent =
    `등록된 사진 ${Number(total) || 0}장`;

  lastUpdated.textContent =
    `마지막 확인 ${new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(new Date())}`;
}


function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}


function scheduleRefresh() {
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
  }

  const interval =
    Number(GUESTBOOK_CONFIG.refreshIntervalMs) || 0;

  if (interval > 0) {
    refreshTimer = window.setInterval(
      pollNewEntries,
      Math.max(5000, interval)
    );
  }
}


function openViewer(entry) {
  viewerFrame.src = entry.mediaUrl;
  viewerMessage.textContent = entry.message || "";
  viewerModal.classList.add("show");
  viewerModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  viewerCloseButton.focus();
}


function closeViewer() {
  viewerModal.classList.remove("show");
  viewerModal.setAttribute("aria-hidden", "true");
  viewerFrame.removeAttribute("src");
  viewerMessage.textContent = "";
  document.body.style.overflow = "";
}


titleElement.textContent =
  GUESTBOOK_CONFIG.title || "PHOTO GUESTBOOK";

retryLoadButton.addEventListener("click", initialLoad);
loadMoreButton.addEventListener("click", loadMore);
viewerCloseButton.addEventListener("click", closeViewer);

viewerBackdrop.addEventListener("click", event => {
  if (event.target === viewerBackdrop) {
    closeViewer();
  }
});

document.addEventListener("keydown", event => {
  if (
    event.key === "Escape" &&
    viewerModal.classList.contains("show")
  ) {
    closeViewer();
  }
});

initialLoad();
