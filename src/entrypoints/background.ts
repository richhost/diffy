export default defineBackground(() => {
  const action = browser.action ?? browser.browserAction;

  action.onClicked.addListener(async () => {
    const appUrl = browser.runtime.getURL("/app.html");
    const matchUrl = appUrl + "*";
    const tabs = await browser.tabs.query({ url: matchUrl });

    if (tabs.length > 0) {
      const tabIds = tabs.map((tab) => tab.id).filter((id): id is number => id !== undefined);
      if (tabIds.length > 0) {
        await browser.tabs.remove(tabIds);
      }
    } else {
      await browser.tabs.create({ url: appUrl, pinned: false });
    }
  });
});
