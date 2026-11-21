<script lang="ts">
  import {
    Dialog,
    DialogBackdrop,
    DialogContent,
    DialogTitle,
    DialogClose,
  } from "@ui-sdk/svelte/dialog";
  import {
    SegmentedControl,
    SegmentedControlIndicator,
    SegmentedControlItem,
  } from "@ui-sdk/svelte/segmented-control";
  import { Tooltip, TooltipTrigger, TooltipContent } from "@ui-sdk/svelte/tooltip";
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
      --diffs-bg: var(--input-bg);
      --diffs-light-bg: var(--input-bg);
      --diffs-dark-bg: var(--input-bg);
      --diffs-addition-color-override: var(--success);
      --diffs-deletion-color-override: var(--danger);
    }
    @keyframes diff-focus-pulse {
      0% {
        box-shadow: inset 0 0 0 1.5px var(--border-active);
      }
      60% {
        box-shadow: inset 0 0 0 1.5px var(--border-active);
      }
      100% {
        box-shadow: none;
      }
    }
    .diff-highlight-active {
      animation: diff-focus-pulse 1.6s ease-out forwards !important;
      position: relative !important;
      z-index: 5 !important;
    }
  `;

  function collectDiffChunks(): HTMLElement[] {
    const container = diffContainer?.querySelector("diffs-container");
    if (!container || !container.shadowRoot) return [];

    const changeElements = Array.from(
      container.shadowRoot.querySelectorAll<HTMLElement>(
        'div[data-line-type="change-addition"], div[data-line-type="change-deletion"]',
      ),
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
      }, 1800);
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
    const currentTheme = isDark ? "pierre-dark" : "pierre-light";
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
          themes: ["pierre-light", "pierre-dark"],
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
      const _theme = themeStore.isDark ? "pierre-dark" : "pierre-light";
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

<Dialog
  open={diffStore.open}
  presentation="dialog"
  onOpenChange={(open) => {
    if (!open) handleClose();
  }}
>
  <DialogBackdrop class="ui-dialog-backdrop" />

  <DialogContent
    class="ui-dialog-content flex flex-col overflow-hidden text-[var(--ink)] transition-[width,max-width,height] duration-180 ease-out {isMaximized
      ? 'w-[94vw] max-w-[94vw] h-[92vh]'
      : 'w-[calc(100vw-2rem)] max-w-5xl h-[82vh]'}"
  >
    <!-- Header -->
    <div
      class="px-5 py-3.5 flex justify-between items-center gap-4 flex-none select-none border-b border-[var(--line)]"
      ondblclick={(e) => {
        if ((e.target as HTMLElement)?.closest("button, input, select, [role='button']")) return;
        isMaximized = !isMaximized;
      }}
      role="none"
    >
      <div class="flex items-baseline gap-2.5 min-w-0">
        <DialogTitle class="text-[14px] font-medium text-[var(--ink)] tracking-tight flex-none">
          {i18n.t("compare")}
        </DialogTitle>
        <span class="text-[11px] text-[var(--ink-tertiary)] font-mono truncate">
          {diffStore.sourceLabel || "source"} → {diffStore.targetLabel || "target"}
        </span>
      </div>

      <div class="flex items-center gap-2 flex-none">
        <!-- Diff Navigation Stepper -->
        <div
          class="flex items-center bg-[var(--surface-subtle)] border border-[var(--border-color)] rounded-[8px] p-0.5 gap-0.5 text-[11px] font-medium text-[var(--ink-secondary)] select-none"
        >
          <Tooltip>
            <TooltipTrigger
              onclick={goToPrevDiff}
              aria-disabled={diffChunks.length === 0 || undefined}
              class="w-6 h-6 rounded-[6px] grid place-items-center hover:text-[var(--ink)] hover:bg-[var(--hover)] aria-disabled:opacity-30 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-active)]"
              aria-label={i18n.t("prevDiff")}
            >
              <ChevronUp class="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} class="ui-tooltip-content">
              {i18n.t("prevDiff")}
            </TooltipContent>
          </Tooltip>

          <span
            class="px-1.5 text-[11px] font-mono tabular-nums font-medium {diffChunks.length > 0
              ? 'text-[var(--ink)]'
              : 'text-[var(--ink-quaternary)]'}"
          >
            {#if diffChunks.length > 0}
              {currentChunkIndex} / {diffChunks.length}
            {:else}
              0 / 0
            {/if}
          </span>

          <Tooltip>
            <TooltipTrigger
              onclick={goToNextDiff}
              aria-disabled={diffChunks.length === 0 || undefined}
              class="w-6 h-6 rounded-[6px] grid place-items-center hover:text-[var(--ink)] hover:bg-[var(--hover)] aria-disabled:opacity-30 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-active)]"
              aria-label={i18n.t("nextDiff")}
            >
              <ChevronDown class="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} class="ui-tooltip-content">
              {i18n.t("nextDiff")}
            </TooltipContent>
          </Tooltip>
        </div>

        <!-- Sort Keys toggle -->
        <button
          type="button"
          onclick={() => (shouldSortKeys = !shouldSortKeys)}
          class="h-[28px] px-2.5 rounded-[8px] text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 border {shouldSortKeys
            ? 'text-[var(--ink)] border-[var(--border-active)] bg-[var(--surface-raised)] shadow-[var(--shadow-xs)]'
            : 'text-[var(--ink-secondary)] border-[var(--border-color)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]'}"
        >
          {i18n.t("sortKeys")}
        </button>

        <!-- Layout toggle (@ui-sdk/svelte SegmentedControl) -->
        <SegmentedControl
          value={diffStyle}
          onValueChange={(next) => {
            if (next === "split" || next === "unified") diffStyle = next;
          }}
          aria-label={i18n.t("compare")}
          class="ui-segmented"
        >
          <SegmentedControlIndicator class="ui-segmented-indicator" />
          <SegmentedControlItem value="split" class="ui-segmented-item">
            {i18n.t("sideBySide")}
          </SegmentedControlItem>
          <SegmentedControlItem value="unified" class="ui-segmented-item">
            {i18n.t("unified")}
          </SegmentedControlItem>
        </SegmentedControl>

        <!-- Maximize / Minimize button -->
        <Tooltip>
          <TooltipTrigger
            onclick={() => (isMaximized = !isMaximized)}
            class="w-7 h-7 grid place-items-center rounded-[6px] text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--hover)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-active)]"
            aria-label={isMaximized ? "Restore" : "Maximize"}
          >
            {#if isMaximized}
              <Minimize class="size-3.5" />
            {:else}
              <Maximize class="size-3.5" />
            {/if}
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} class="ui-tooltip-content">
            {isMaximized ? "Restore" : "Maximize"}
          </TooltipContent>
        </Tooltip>

        <DialogClose
          class="w-7 h-7 grid place-items-center rounded-[6px] text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--hover)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-active)]"
          aria-label="Close"
        >
          <X class="size-4" />
        </DialogClose>
      </div>
    </div>

    <!-- Diff viewer body -->
    <div class="flex-1 overflow-hidden min-h-0 bg-[var(--input-bg)]">
      <div bind:this={diffContainer} class="h-full overflow-auto font-mono text-xs"></div>
    </div>
  </DialogContent>
</Dialog>
