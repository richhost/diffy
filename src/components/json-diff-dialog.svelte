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
  import { sortJSONKeys } from "~/utils/json";
  import { i18n } from "~/stores/i18n.svelte";

  let shouldSortKeys = $state(false);

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
    :host {
      --diffs-font-family: "JetBrains Mono Variable", ui-monospace, monospace;
      --diffs-header-font-family: "Geist Sans", -apple-system, sans-serif;
    }
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

        let oldContents = diffStore.sourceJson;
        let newContents = diffStore.targetJson;

        if (shouldSortKeys) {
          try {
            oldContents = JSON.stringify(sortJSONKeys(JSON.parse(oldContents)), null, 2);
          } catch (e) {}
          try {
            newContents = JSON.stringify(sortJSONKeys(JSON.parse(newContents)), null, 2);
          } catch (e) {}
        }

        const oldFile = {
          name: (diffStore.sourceLabel || "source") + ".json",
          contents: oldContents,
        };
        const newFile = {
          name: (diffStore.targetLabel || "target") + ".json",
          contents: newContents,
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
      const _sort = shouldSortKeys;
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
        class="w-full max-w-5xl bg-surface rounded-(--radius-lg) overflow-hidden flex flex-col h-[82vh] text-text-primary animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
        style="box-shadow: 0 20px 60px var(--color-shadow), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 0.5px var(--color-border);"
      >
        <!-- Header -->
        <div class="px-6 pt-5 pb-4 flex justify-between items-start flex-none">
          <div class="flex flex-col gap-0.5">
            <Dialog.Title
              class="text-[15px] font-semibold text-text-primary tracking-tight"
            >
              {i18n.t("compare")}
            </Dialog.Title>
            <div class="text-[11px] text-text-quaternary font-mono">
              {diffStore.sourceLabel || "source"} → {diffStore.targetLabel ||
                "target"}
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Sort Keys toggle -->
            <button
              onclick={() => (shouldSortKeys = !shouldSortKeys)}
              class="h-[26px] px-3 rounded-[var(--radius-md)] text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 {shouldSortKeys ? 'text-primary font-semibold border-[0.5px] border-primary bg-primary-light' : 'text-text-secondary border-[0.5px] border-transparent bg-neutral-bg hover:bg-border'}"
            >
              {i18n.t("sortKeys")}
            </button>

            <!-- Layout toggle -->
            <div
              class="flex items-center bg-neutral-bg rounded-md p-0.5 gap-0.5"
            >
              <button
                onclick={() => (diffStyle = "split")}
                class="px-3 py-1 rounded-[var(--radius-sm)] text-[11px] font-medium transition-all cursor-pointer {diffStyle ===
                'split'
                  ? 'bg-surface text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-text-secondary hover:text-text-primary'}"
              >
                {i18n.t("sideBySide")}
              </button>
              <button
                onclick={() => (diffStyle = "unified")}
                class="px-3 py-1 rounded-sm text-[11px] font-medium transition-all cursor-pointer {diffStyle ===
                'unified'
                  ? 'bg-surface text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-text-secondary hover:text-text-primary'}"
              >
                {i18n.t("unified")}
              </button>
            </div>

            <Dialog.CloseTrigger
              onclick={handleClose}
              class="w-7 h-7 grid place-items-center rounded-full text-text-secondary hover:text-text-primary hover:bg-neutral-bg transition-all cursor-pointer"
              aria-label="Close"
            >
              <X class="size-4" />
            </Dialog.CloseTrigger>
          </div>
        </div>

        <!-- Divider -->
        <div class="h-px bg-border flex-none"></div>

        <!-- Diff viewer body -->
        <div class="flex-1 overflow-hidden min-h-0 bg-surface">
          <div
            bind:this={diffContainer}
            class="h-full overflow-auto font-mono text-xs"
          ></div>
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog.Root>
