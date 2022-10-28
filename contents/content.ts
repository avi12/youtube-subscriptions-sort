import type { PlasmoContentScript } from "plasmo";
import timeToSeconds from "time-to-seconds";

let elVideoParents = [];
const keysPressedInit = {
  ControlLeft: false,
  MetaLeft: false,
  ShiftLeft: false
};
let keysPressed = { ...keysPressedInit };
const keysPressedNewWindowInit = {
  ControlLeft: false,
  MetaLeft: false,
  ShiftLeft: false,
  CapsLock: false
};
let keysPressedNewWindow = { ...keysPressedNewWindowInit };
let isHeldKeys = false;

enum Selectors {
  videoParent = "ytd-grid-video-renderer, ytd-video-renderer, ytd-rich-item-renderer",
  videoLink = "a#video-title[href*='/watch'], a#video-title[href*='/shorts'], a#video-title-link[href*='/watch'], a#video-title-link[href*='/shorts']",
  videoColor = "#video-title",
  videoTime = "ytd-thumbnail-overlay-time-status-renderer"
}

function onVideoSelect(e: MouseEvent) {
  if (!e.ctrlKey || !e.metaKey || !e.shiftKey) {
    return;
  }

  const elParent = (<HTMLElement>e.target).closest(Selectors.videoParent);
  if (!elParent) {
    return;
  }

  e.preventDefault();

  const iVideoParent = elVideoParents.indexOf(elParent);
  if (iVideoParent === -1) {
    elVideoParents.push(elParent);
  } else {
    elVideoParents.splice(iVideoParent, 1);
  }
  elParent.querySelector<HTMLAnchorElement>(Selectors.videoColor).classList.toggle("video-selected");
  isHeldKeys = true;
}

function onKeyUp(e: KeyboardEvent) {
  if (!isHeldKeys) {
    return;
  }

  const keysToBePressed = Object.keys(keysPressedInit);
  keysToBePressed.forEach(key => {
    keysPressed[key] = keysPressed[key] || e.code === key;
  });

  const keysToBePressedNewWindow = Object.keys(keysPressedNewWindowInit);
  keysToBePressedNewWindow.forEach(key => {
    keysPressedNewWindow[key] =
      keysPressedNewWindow[key] || (key === "CapsLock" ? e.getModifierState("CapsLock") : e.code === key);
  });

  if (!(Object.values(keysPressedNewWindow).every(Boolean) || Object.values(keysPressed).every(Boolean))) {
    return;
  }

  const links = elVideoParents
    .sort((elA, elB) => {
      const a = elA.querySelector(Selectors.videoTime).textContent;
      const b = elB.querySelector(Selectors.videoTime).textContent;
      if (a.includes("SHORTS") || b.includes("SHORTS")) {
        return -1;
      }
      if (a.includes("LIVE") || b.includes("LIVE")) {
        return 1;
      }
      return timeToSeconds(a) - timeToSeconds(b);
    })
    .map(elParent => elParent.querySelector(Selectors.videoLink).href);
  chrome.runtime.sendMessage({
    openLinks: [...new Set(links)],
    isNewWindow: keysPressedNewWindow.CapsLock
  });
  elVideoParents.forEach(elParent => {
    elParent.querySelector(Selectors.videoColor).classList.remove("video-selected");
  });
  keysPressed = { ...keysPressedInit };
  keysPressedNewWindow = { ...keysPressedNewWindowInit };
  elVideoParents = [];
  isHeldKeys = false;
}

document.addEventListener("click", onVideoSelect);
document.addEventListener("keyup", onKeyUp);

export const config: PlasmoContentScript = {
  matches: ["https://www.youtube.com/*"]
};
