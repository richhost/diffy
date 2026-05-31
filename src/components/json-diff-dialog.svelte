<script lang="ts">
  import { Dialog } from "@ark-ui/svelte/dialog";
  import { Portal } from "@ark-ui/svelte/portal";
  import {
    FileDiff,
    parseDiffFromFile,
    getSharedHighlighter,
    wrapCoreCSS,
  } from "@pierre/diffs";
  import X from "@tabler/icons-svelte-runes/icons/x";
  import { diffStore } from "~/stores/diff.svelte";

  // Register diffs-container custom element
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

  const themeOverrides = `
    color-scheme: light;
    --diffs-light-bg: #ffffff;
    --diffs-light: #1d1d1f;
    --diffs-fg-number-override: #aeaeb2;
    --diffs-bg-separator-override: #f5f5f7;
    --diffs-bg-context-override: #fafafa;
    --diffs-bg-context-gutter-override: #f5f5f7;
  `;

  $effect(() => {
    if (!diffStore.open || !diffContainer) return;

    const container = document.createElement("diffs-container");
    diffContainer.appendChild(container);

    const instance = new FileDiff({
      diffStyle: $state.snapshot(diffStyle),
      theme: "pierre-light",
      unsafeCSS: themeOverrides,
      themeType: "light",
    });

    let active = true;

    async function render(currentStyle: "split" | "unified") {
      try {
        await getSharedHighlighter({
          themes: ["pierre-light"],
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
          theme: "pierre-light",
          unsafeCSS: themeOverrides,
          themeType: "light",
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

    $effect(() => {
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
    <!-- Backdrop -->
    <Dialog.Backdrop
      class="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200"
    />

    <Dialog.Positioner
      class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <Dialog.Content
        class="w-full max-w-5xl bg-white rounded-2xl overflow-hidden flex flex-col h-[82vh] text-[#1d1d1f] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
        style="box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.08);"
      >
        <!-- Header -->
        <div class="px-6 pt-5 pb-4 flex justify-between items-start flex-none">
          <div class="flex flex-col gap-0.5">
            <Dialog.Title
              class="text-[15px] font-semibold text-[#1d1d1f] tracking-tight"
            >
              Compare
            </Dialog.Title>
            <div class="text-[11px] text-[#aeaeb2] font-mono">
              {diffStore.sourceLabel || "source"} → {diffStore.targetLabel ||
                "target"}
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Layout toggle -->
            <div
              class="flex items-center bg-[#f5f5f7] rounded-lg p-0.5 gap-0.5"
            >
              <button
                onclick={() => (diffStyle = "split")}
                class="px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer {diffStyle ===
                'split'
                  ? 'bg-white text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'}"
              >
                Side by side
              </button>
              <button
                onclick={() => (diffStyle = "unified")}
                class="px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer {diffStyle ===
                'unified'
                  ? 'bg-white text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'}"
              >
                Unified
              </button>
            </div>

            <Dialog.CloseTrigger
              onclick={handleClose}
              class="w-7 h-7 grid place-items-center rounded-full text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/6 transition-all cursor-pointer"
              aria-label="Close"
            >
              <X class="size-4" />
            </Dialog.CloseTrigger>
          </div>
        </div>

        <!-- Divider -->
        <div class="h-px bg-black/6 flex-none"></div>

        <!-- Diff viewer body -->
        <div class="flex-1 overflow-hidden min-h-0 bg-white">
          <div
            bind:this={diffContainer}
            class="h-full overflow-auto font-mono text-xs"
          ></div>
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog.Root>
