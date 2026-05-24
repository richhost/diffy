<script lang="ts">
  import { Dialog } from "@ark-ui/svelte/dialog";
  import { Portal } from "@ark-ui/svelte/portal";
  import { FileDiff, parseDiffFromFile, getSharedHighlighter, wrapCoreCSS } from "@pierre/diffs";
  import X from "@tabler/icons-svelte-runes/icons/x";
  import LayoutColumns from "@tabler/icons-svelte-runes/icons/layout-columns";
  import LayoutRows from "@tabler/icons-svelte-runes/icons/layout-rows";
  import { diffStore } from "~/stores/diff.svelte";

  // Safely define the diffs-container custom element locally using public exports
  if (typeof window !== "undefined" && !customElements.get("diffs-container")) {
    const coreStyles = wrapCoreCSS("");

    class FileDiffContainer extends HTMLElement {
      constructor() {
        super();
        if (this.shadowRoot != null) return;
        const shadowRoot = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = coreStyles;
        shadowRoot.appendChild(style);
      }
    }
    customElements.define("diffs-container", FileDiffContainer);
  }

  let diffContainer = $state<HTMLDivElement | null>(null);
  let diffStyle = $state<"split" | "unified">("split");

  // Keep rendering and config updated Reactively via nested $effects
  $effect(() => {
    if (!diffStore.open || !diffContainer) return;

    const container = document.createElement("diffs-container");
    diffContainer.appendChild(container);

    // Match the project's neutral-900 dark palette via CSS variable overrides
    const themeOverrides = `
      color-scheme: dark;
      --diffs-dark-bg: #171717;
      --diffs-dark: #e5e5e5;
      --diffs-fg-number-override: #525252;
      --diffs-bg-separator-override: #1f1f1f;
      --diffs-bg-context-override: #1c1c1c;
      --diffs-bg-context-gutter-override: #1a1a1a;
    `;

    const instance = new FileDiff({
      diffStyle: $state.snapshot(diffStyle),
      theme: "pierre-dark",
      unsafeCSS: themeOverrides,
      themeType: "dark",
    });

    let active = true;

    async function render(currentStyle: "split" | "unified") {
      try {
        // Preload themes and languages for the shared highlighter
        await getSharedHighlighter({
          themes: ["pierre-dark"],
          langs: ["json"],
        });

        if (!active) return;

        const oldFile = {
          name: (diffStore.sourceLabel || "source") + ".json",
          contents: diffStore.sourceJson,
        };
        const newFile = {
          name: (diffStore.targetLabel || "target") + ".json",
          contents: diffStore.targetJson,
        };

        const fileDiff = parseDiffFromFile(oldFile, newFile);

        instance.setOptions({
          diffStyle: currentStyle,
          theme: "pierre-dark",
          unsafeCSS: themeOverrides,
          themeType: "dark",
        });

        instance.render({
          oldFile,
          newFile,
          fileDiff,
          fileContainer: container,
        });
      } catch (e) {
        console.error("Failed to render diff:", e);
      }
    }

    // Reactively trigger render when style or json changes
    $effect(() => {
      // Establish reactive dependencies on style and json inputs
      const currentStyle = diffStyle;
      const _src = diffStore.sourceJson;
      const _tgt = diffStore.targetJson;
      const _srcLbl = diffStore.sourceLabel;
      const _tgtLbl = diffStore.targetLabel;

      render(currentStyle);
    });

    return () => {
      active = false;
      container.remove();
      instance.cleanUp();
    };
  });

  function handleClose() {
    diffStore.close();
  }
</script>

<Dialog.Root
  open={diffStore.open}
  onOpenChange={(e) => {
    if (!e.open) handleClose();
  }}
>
  <Portal>
    <Dialog.Backdrop
      class="fixed inset-0 z-40 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    />
    <Dialog.Positioner
      class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <Dialog.Content
        class="w-full max-w-5xl bg-neutral-900/95 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col h-[80vh] text-neutral-100 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200"
      >
        <!-- Header -->
        <div
          class="px-6 py-4 border-b border-white/[0.06] flex justify-between items-center bg-neutral-900/40"
        >
          <div class="flex flex-col gap-0.5">
            <Dialog.Title
              class="text-sm font-semibold text-neutral-200 tracking-tight"
            >
              Comparing Changes
            </Dialog.Title>
            <div class="text-[10px] text-neutral-400 font-mono">
              {diffStore.sourceLabel || "source"} → {diffStore.targetLabel ||
                "target"}
            </div>
          </div>
          <Dialog.CloseTrigger
            onclick={handleClose}
            class="text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer p-1 rounded-md hover:bg-white/[0.06]"
            aria-label="Close"
          >
            <X class="size-4" />
          </Dialog.CloseTrigger>
        </div>

        <!-- Body -->
        <div
          class="p-6 flex-1 overflow-hidden bg-transparent flex flex-col min-h-0"
        >
          <div
            bind:this={diffContainer}
            class="flex-1 overflow-auto border border-white/[0.06] rounded-md bg-[#171717] min-h-0 font-mono text-xs custom-scrollbar"
          ></div>
        </div>

        <!-- Footer -->
        <div
          class="px-6 py-4 border-t border-white/[0.06] bg-neutral-950/40 flex justify-between items-center"
        >
          <!-- Toggle Layout Switcher -->
          <div class="flex bg-neutral-900/60 p-0.5 rounded-lg border border-white/[0.04]">
            <button
              onclick={() => (diffStyle = "split")}
              class="px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer {diffStyle ===
              'split'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'}"
            >
              <LayoutColumns class="size-3.5" />
              Side-by-Side
            </button>
            <button
              onclick={() => (diffStyle = "unified")}
              class="px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer {diffStyle ===
              'unified'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'}"
            >
              <LayoutRows class="size-3.5" />
              Unified
            </button>
          </div>

          <button
            onclick={handleClose}
            class="px-4.5 py-2 border border-white/[0.08] rounded-md hover:bg-white/[0.06] text-neutral-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog.Root>

<style>
  /* Custom scrollbar for diff container */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
