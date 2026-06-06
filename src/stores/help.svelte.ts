import { storage } from "@wxt-dev/storage";

const GUIDE_SEEN_KEY = "local:diffy:guide:seen";

class HelpStore {
  open = $state(false);
  hasSeenGuide = $state(false);
  loading = $state(true);

  async init() {
    this.loading = true;
    try {
      const seen = await storage.getItem<boolean>(GUIDE_SEEN_KEY);
      this.hasSeenGuide = !!seen;
      if (!seen) {
        this.open = true;
      }
    } catch (err) {
      console.error("Failed to load guide status from storage:", err);
    } finally {
      this.loading = false;
    }
  }

  async markAsSeen() {
    this.hasSeenGuide = true;
    try {
      await storage.setItem(GUIDE_SEEN_KEY, true);
    } catch (err) {
      console.error("Failed to save guide status to storage:", err);
    }
  }

  openHelp() {
    this.open = true;
  }

  close() {
    this.open = false;
    this.markAsSeen();
  }
}

export const helpStore = new HelpStore();
