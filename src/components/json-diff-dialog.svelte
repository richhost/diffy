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
  import Maximize from "@tabler/icons-svelte-runes/icons/maximize";
  import Minimize from "@tabler/icons-svelte-runes/icons/minimize";
  import ChevronUp from "@tabler/icons-svelte-runes/icons/chevron-up";
  import ChevronDown from "@tabler/icons-svelte-runes/icons/chevron-down";
  import { diffStore } from "~/stores/diff.svelte";
  import { themeStore } from "~/stores/theme.svelte";
  import { sortJSONKeys } from "~/utils/json";
  import { i18n } from "~/stores/i18n.svelte";

  let shouldSortKeys = $state(false);
  let isMaximized = $state(false);
  let diffChunks = $state<HTMLElement[]>([]);
  let currentChunkIndex = $state(0);

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
      --diffs-font-family: "Google Sans Code Variable", ui-monospace, monospace;
      --diffs-header-font-family: "Geist Sans", -apple-system, sans-serif;
    }
    @keyframes diff-focus-pulse {
      0% {
        box-shadow: inset 0 0 0 2px var(--color-primary, #3b82f6), 0 0 10px var(--color-primary, #3b82f6);
      }
      60% {
        box-shadow: inset 0 0 0 2px var(--color-primary, #3b82f6), 0 0 4px var(--color-primary, #3b82f6);
      }
      100% {
        box-shadow: none;
      }
    }
    .diff-highlight-active {
      animation: diff-focus-pulse 1.8s ease-out forwards !important;
      position: relative !important;
      z-index: 5 !important;
    }
  `;

  function collectDiffChunks(): HTMLElement[] {
    const container = diffContainer?.querySelector("diffs-container");
    if (!container || !container.shadowRoot) return [];

    const changeElements = Array.from(
      container.shadowRoot.querySelectorAll<HTMLElement>(
        'div[data-line-type="change-addition"], div[data-line-type="change-deletion"]'
      )
    );

    if (changeElements.length === 0) return [];

    const sorted = [...changeElements].sort((a, b) => a.offsetTop - b.offsetTop);
    const chunks: HTMLElement[] = [];
    let prevTop = -9999;
    const ROW_HEIGHT_THRESHOLD = 32;

    for (const el of sorted) {
      if (el.offsetTop - prevTop > ROW_HEIGHT_THRESHOLD) {
        chunks.push(el);
      }
      prevTop = el.offsetTop;
    }

    return chunks;
  }

  function updateDiffChunks() {
    setTimeout(() => {
      diffChunks = collectDiffChunks();
      if (diffChunks.length > 0) {
        if (currentChunkIndex === 0 || currentChunkIndex > diffChunks.length) {
          currentChunkIndex = 1;
        }
      } else {
        currentChunkIndex = 0;
      }
    }, 60);
  }

  function scrollToChunk(index: number, applyHighlight = true) {
    if (diffChunks.length === 0 || index < 1 || index > diffChunks.length) return;
    currentChunkIndex = index;
    const target = diffChunks[index - 1];
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });

    if (applyHighlight) {
      const container = diffContainer?.querySelector("diffs-container");
      if (container && container.shadowRoot) {
        container.shadowRoot.querySelectorAll(".diff-highlight-active").forEach((el) => {
          el.classList.remove("diff-highlight-active");
        });
      }
      target.classList.add("diff-highlight-active");
      setTimeout(() => {
        target.classList.remove("diff-highlight-active");
      }, 2000);
    }
  }

  function goToNextDiff() {
    if (diffChunks.length === 0) return;
    const next = currentChunkIndex >= diffChunks.length ? 1 : currentChunkIndex + 1;
    scrollToChunk(next);
  }

  function goToPrevDiff() {
    if (diffChunks.length === 0) return;
    const prev = currentChunkIndex <= 1 ? diffChunks.length : currentChunkIndex - 1;
    scrollToChunk(prev);
  }

  $effect(() => {
    if (!diffStore.open) return;

    function onKeydown(e: KeyboardEvent) {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (
        e.key === "]" ||
        (e.altKey && e.key === "ArrowDown") ||
        (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey)
      ) {
        e.preventDefault();
        goToNextDiff();
      } else if (
        e.key === "[" ||
        (e.altKey && e.key === "ArrowUp") ||
        (e.key.toLowerCase() === "p" && !e.metaKey && !e.ctrlKey)
      ) {
        e.preventDefault();
        goToPrevDiff();
      }
    }

    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  });

  $effect(() => {
    if (!diffStore.open || !diffContainer) return;

    const container = document.createElement("diffs-container");
    diffContainer.appendChild(container);

    const isDark = themeStore.isDark;
    const currentTheme = isDark ? "ayu-dark" : "pierre-light";
    const currentThemeType = themeStore.resolvedTheme;

    const instance = new FileDiff({
      diffStyle: $state.snapshot(diffStyle),
      theme: currentTheme,
      unsafeCSS: themeOverrides,
      themeType: currentThemeType,
    });

    let active = true;

    async function render(
      currentStyle: "split" | "unified",
      themeName: string,
      themeType: "light" | "dark",
    ) {
      try {
        await getSharedHighlighter({
          themes: ["pierre-light", "ayu-dark"],
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
          theme: themeName,
          unsafeCSS: themeOverrides,
          themeType: themeType,
        });

        instance.render({
          oldFile,
          newFile,
          fileDiff,
          fileContainer: container,
        });

        updateDiffChunks();
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
      const _theme = themeStore.isDark ? "ayu-dark" : "pierre-light";
      const _themeType = themeStore.resolvedTheme;
      render(currentStyle, _theme, _themeType);
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
      class="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200"
    />

    <Dialog.Positioner
      class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <Dialog.Content
        class="w-full bg-surface rounded-(--radius-lg) overflow-hidden flex flex-col text-text-primary transition-all duration-200 ease-out animate-in fade-in zoom-in-95 slide-in-from-bottom-2 {isMaximized
          ? 'max-w-[94vw] h-[92vh]'
          : 'max-w-5xl h-[82vh]'}"
        style="box-shadow: 0 20px 60px var(--color-shadow), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 0.5px var(--color-border);"
      >
        <!-- Header -->
        <div
          class="px-6 pt-5 pb-4 flex justify-between items-start flex-none select-none"
          ondblclick={(e) => {
            if ((e.target as HTMLElement)?.closest("button, input, select, [role='button']")) return;
            isMaximized = !isMaximized;
          }}
          role="none"
        >
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

          <div class="flex items-center gap-2">
            <!-- Diff Navigation Stepper -->
            <div
              class="flex items-center bg-neutral-bg rounded-md p-0.5 gap-0.5 mr-0.5 text-[11px] font-medium text-text-secondary select-none"
            >
              <button
                type="button"
                onclick={goToPrevDiff}
                disabled={diffChunks.length === 0}
                class="w-6 h-6 rounded-[var(--radius-sm)] grid place-items-center hover:text-text-primary hover:bg-surface disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
                title={i18n.t("prevDiff")}
                aria-label={i18n.t("prevDiff")}
              >
                <ChevronUp class="size-3.5" />
              </button>

              <span
                class="px-1.5 text-[11px] font-mono tabular-nums font-medium {diffChunks.length > 0
                  ? 'text-text-primary'
                  : 'text-text-quaternary'}"
              >
                {#if diffChunks.length > 0}
                  {currentChunkIndex} / {diffChunks.length}
                {:else}
                  0 / 0
                {/if}
              </span>

              <button
                type="button"
                onclick={goToNextDiff}
                disabled={diffChunks.length === 0}
                class="w-6 h-6 rounded-[var(--radius-sm)] grid place-items-center hover:text-text-primary hover:bg-surface disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
                title={i18n.t("nextDiff")}
                aria-label={i18n.t("nextDiff")}
              >
                <ChevronDown class="size-3.5" />
              </button>
            </div>

            <!-- Sort Keys toggle -->
            <button
              onclick={() => (shouldSortKeys = !shouldSortKeys)}
              class="h-[26px] px-3 rounded-[var(--radius-md)] text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 {shouldSortKeys ? 'text-primary font-semibold border-[0.5px] border-primary bg-primary-light' : 'text-text-secondary border-[0.5px] border-transparent bg-neutral-bg hover:bg-border'}"
            >
              {i18n.t("sortKeys")}
            </button>

            <!-- Layout toggle -->
            <div
              class="flex items-center bg-neutral-bg rounded-md p-0.5 gap-0.5 mr-1"
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

            <!-- Maximize / Minimize button -->
            <button
              type="button"
              onclick={() => (isMaximized = !isMaximized)}
              class="w-7 h-7 grid place-items-center rounded-full text-text-secondary hover:text-text-primary hover:bg-neutral-bg transition-all cursor-pointer"
              title={isMaximized ? "Restore" : "Maximize"}
              aria-label={isMaximized ? "Restore" : "Maximize"}
            >
              {#if isMaximized}
                <Minimize class="size-3.5" />
              {:else}
                <Maximize class="size-3.5" />
              {/if}
            </button>

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
