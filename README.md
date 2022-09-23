# YouTube Subscriptions Sort

Lets you open selected videos in an ascending watch time order  
For example, suppose you want to watch a 5-minute video, 15-minute video and 10-minute video, the new order will be:
1. 5-minute video
2. 10-minute video
3. 15-minute video

![Screenshot](https://user-images.githubusercontent.com/6422804/191924845-3ca34767-c70c-4c08-8b71-a8b7b1da9c1b.png)

## How to use?
Press <kbd>Ctrl</kbd><kbd>Windows</kbd><kbd>Alt</kbd> / <kbd>Ctrl</kbd><kbd>Cmd</kbd><kbd>Option</kbd> to open the videos in new tabs

If you want to launch in a new window, toggle on the <kbd>Caps Lock</kbd> key

### Note:
If while trying to launch in a new window you already have a window that only consists of YouTube videos, the extension will populate the new videos in the correct order relative to the already-open videos 

---

This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

### Getting Started

First, run the development server:

```bash
pnpm dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the Chrome browser using Manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the content script by modifying `contents/content.ts`. It should auto-update as you make changes.

For further guidance, [visit the Documentation](https://docs.plasmo.com/)

### Making production build

Run the following:

```bash
pnpm build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.
