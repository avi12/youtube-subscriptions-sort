import Tab = chrome.tabs.Tab;
import OnClickData = chrome.contextMenus.OnClickData;
import Window = chrome.windows.Window;

async function urlToLength(url: string): Promise<{ url: string; videoLength: number }> {
  const response = await fetch(url);
  const text = await response.text();
  const regexVideoData = /ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+meta|<\/script|\n)/;
  const videoData = JSON.parse(text.match(regexVideoData)[1]);
  const [{ approxDurationMs }] = videoData.streamingData.adaptiveFormats;
  return { url, videoLength: Number(approxDurationMs) };
}

async function getSortLengths({
  tabsYouTube,
  openLinks
}: {
  openLinks: string[];
  tabsYouTube: Tab[];
}): Promise<Awaited<{ url: string; index: number }>[]> {
  const promiseLengthsA = openLinks.map(urlToLength);
  const promiseLengthsB = tabsYouTube.map(({ url }) => urlToLength(url));
  const lengthsAll = await Promise.all([...promiseLengthsA, ...promiseLengthsB]);
  const lengthsSorted = lengthsAll.sort((a, b) => a.videoLength - b.videoLength);
  const urls: { url: string; index: number }[] = [];
  for (let index = 0; index < lengthsSorted.length; index++) {
    const { url } = lengthsSorted[index];
    if (openLinks.includes(url)) {
      urls.push({ url, index });
    }
  }

  return urls;
}

async function getWindowYouTubeOnly(): Promise<Window | null> {
  const windows = await chrome.windows.getAll({ populate: true, windowTypes: ["normal"] });
  return windows.find(({ tabs }) =>
    tabs.every(({ url }) => url.match(/^https:\/\/www\.youtube\.com\/(?:watch|shorts)/))
  );
}

async function openInNewOrExistingWindow(openLinks: string[], window?: Window): Promise<void> {
  const windowYouTubeOnly = window || (await getWindowYouTubeOnly());
  if (windowYouTubeOnly) {
    const sortLengths = await getSortLengths({ tabsYouTube: windowYouTubeOnly.tabs, openLinks });
    const promiseTabs: Promise<Tab>[] = sortLengths.map(({ url, index }) =>
      chrome.tabs.create({
        url,
        index,
        windowId: windowYouTubeOnly.id,
        active: index === 0
      })
    );
    await Promise.all([...promiseTabs, chrome.windows.update(windowYouTubeOnly.id, { focused: true })]);
    return;
  }

  const { id: windowId } = await chrome.windows.create({ url: openLinks[0], state: "maximized" });
  const promiseTabs: Promise<Tab>[] = [];
  for (let i = 1; i < openLinks.length; i++) {
    promiseTabs.push(chrome.tabs.create({ url: openLinks[i], windowId, active: false }));
  }
  await Promise.all(promiseTabs);
}

chrome.runtime.onMessage.addListener(async ({ isNewWindow, openLinks }, sender) => {
  if (isNewWindow) {
    await openInNewOrExistingWindow(openLinks);
    return;
  }

  const { id: windowId } = await chrome.windows.getCurrent();
  const promiseTabs: Promise<Tab>[] = openLinks.map((url, i) =>
    chrome.tabs.create({ url, windowId, active: i === 0, index: i + 1 + sender.tab.index })
  );
  await Promise.all(promiseTabs);
  return;
});

chrome.contextMenus.create({
  id: "open-in-new-or-existing-window",
  title: "Open in a dedicated YouTube window",
  contexts: ["link", "page"],
  documentUrlPatterns: ["https://www.youtube.com/watch*", "https://www.youtube.com/shorts/*"],
  targetUrlPatterns: ["https://www.youtube.com/watch*", "https://www.youtube.com/shorts/*"]
});

chrome.contextMenus.onClicked.addListener(async ({ linkUrl, pageUrl }: OnClickData, tab: Tab) => {
  const windowYouTubeOnly = await getWindowYouTubeOnly();
  if (!windowYouTubeOnly) {
    const windowNew = await chrome.windows.create();
    await chrome.tabs.move(tab.id, {
      windowId: windowNew.id,
      index: 0
    });
    return;
  }

  const pUrl = linkUrl || pageUrl;
  const sortLengths = await getSortLengths({
    tabsYouTube: windowYouTubeOnly.tabs,
    openLinks: [pUrl]
  });
  const { index } = sortLengths.find(({ url }) => pUrl === url);
  const tabMoved = await chrome.tabs.move(tab.id, {
    windowId: windowYouTubeOnly.id,
    index
  });
  await Promise.all([
    chrome.windows.update(windowYouTubeOnly.id, { focused: true }),
    chrome.tabs.update(tabMoved.id, { active: index === 0 })
  ]);
});
export {};
