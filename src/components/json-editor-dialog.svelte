<script lang="ts">
  import {
    Dialog,
    DialogBackdrop,
    DialogContent,
    DialogTitle,
    DialogClose,
  } from "@ui-sdk/svelte/dialog";
  import { Tooltip, TooltipTrigger, TooltipContent } from "@ui-sdk/svelte/tooltip";
  import { editorStore } from "~/stores/editor.svelte";
  import { graphStore } from "~/stores/graph.svelte";
  import JsonEditor from "./json-editor.svelte";
  import X from "@tabler/icons-svelte-runes/icons/x";
  import Maximize from "@tabler/icons-svelte-runes/icons/maximize";
  import Minimize from "@tabler/icons-svelte-runes/icons/minimize";
  import {
    sortJSONKeys,
    deepParseJSON,
    parseLooseJSON,
    checkCanDeepParse,
    inspectJSONStatus,
  } from "~/utils/json";
  import { i18n } from "~/stores/i18n.svelte";

  let labelValue = $state("");
  let jsonValue = $state("");
  let jsonError = $state<string | null>(null);
  let isMaximized = $state(false);
  let editorRef = $state<ReturnType<typeof JsonEditor> | undefined>(undefined);

  const jsonStatus = $derived(inspectJSONStatus(jsonValue));
  const canDeepParse = $derived(checkCanDeepParse(jsonValue));

  $effect(() => {
    if (editorStore.open && editorStore.target) {
      labelValue = editorStore.target.label;
      jsonValue = editorStore.target.json;
      jsonError = null;
      requestAnimationFrame(() => {
        setTimeout(() => editorRef?.focus(), 30);
      });
    }
  });

  $effect(() => {
    if (jsonStatus.status !== "invalid") {
      jsonError = null;
    }
  });

  function handleJumpToError() {
    editorRef?.jumpToPosition(jsonStatus.errorPos);
  }

  function handleSave() {
    try {
      const formatted = jsonValue.trim() ? JSON.stringify(JSON.parse(jsonValue), null, 2) : "";
      if (editorStore.target) {
        graphStore.updateNodeData(editorStore.target.nodeId, {
          label: labelValue.trim() || "Untitled Node",
          json: formatted,
        });
      }
      editorStore.close();
    } catch (e: any) {
      jsonError = e.message || "Invalid JSON";
      handleJumpToError();
    }
  }

  function handleCancel() {
    editorStore.close();
  }

  function handleFormat() {
    if (!jsonValue.trim()) return;
    try {
      const parsed = JSON.parse(jsonValue);
      jsonValue = JSON.stringify(parsed, null, 2);
      jsonError = null;
    } catch (e: any) {
      jsonError = e.message || "Invalid JSON";
      handleJumpToError();
    }
  }

  function handleDeepParse() {
    const raw = jsonValue.trim();
    if (!raw) return;

    try {
      const parsed = parseLooseJSON(raw);
      const deepParsed = deepParseJSON(parsed);

      if (typeof deepParsed === "object" && deepParsed !== null) {
        jsonValue = JSON.stringify(deepParsed, null, 2);
        jsonError = null;
      } else {
        jsonError = "Parsed value is not a valid JSON object or array.";
      }
    } catch (e: any) {
      jsonError = "Failed to parse: " + (e.message || "Invalid JSON");
    }
  }

  function handleSortKeys() {
    const raw = jsonValue.trim();
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const sorted = sortJSONKeys(parsed);
      jsonValue = JSON.stringify(sorted, null, 2);
      jsonError = null;
    } catch (e: any) {
      jsonError = "Failed to sort: " + (e.message || "Invalid JSON");
      handleJumpToError();
    }
  }
</script>

<Dialog
  open={editorStore.open}
  presentation="dialog"
  onOpenChange={(open) => {
    if (!open) editorStore.close();
  }}
>
  <DialogBackdrop class="ui-dialog-backdrop" />

  <DialogContent
    onkeydown={(e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "f") {
          e.preventDefault();
          editorRef?.openSearch();
        } else if (key === "s" || e.key === "Enter") {
          e.preventDefault();
          handleSave();
        }
      }
    }}
    class="ui-dialog-content flex flex-col overflow-hidden text-[var(--ink)] transition-[width,max-width,height] duration-180 ease-out {isMaximized
      ? 'w-[94vw] max-w-[94vw] h-[92vh]'
      : 'w-[calc(100vw-2rem)] max-w-4xl h-[80vh]'}"
  >
    <!-- Zone 1: Unified Header Bar -->
    <div
      class="px-4 py-2.5 flex items-center justify-between gap-3 border-b border-[var(--line)] select-none flex-none"
      ondblclick={(e) => {
        if ((e.target as HTMLElement)?.closest("button, input, select, [role='button']")) return;
        isMaximized = !isMaximized;
      }}
      role="none"
    >
      <DialogTitle class="sr-only">{i18n.t("editNode")}</DialogTitle>

      <input
        id="node-label"
        type="text"
        bind:value={labelValue}
        placeholder={i18n.t("label")}
        aria-label={i18n.t("label")}
        onkeydown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            editorRef?.focus();
          }
        }}
        class="h-7 w-56 max-w-[45vw] rounded-[6px] bg-transparent hover:bg-[var(--hover)] focus:bg-[var(--surface-subtle)] border border-transparent focus:border-[var(--border-strong)] px-2 text-[13.5px] font-medium text-[var(--ink)] placeholder-[var(--ink-quaternary)] outline-none transition-colors"
      />

      <div class="flex items-center gap-1 -mr-1">
        {#if canDeepParse}
          <button
            type="button"
            onclick={handleDeepParse}
            class="h-7 px-2.5 rounded-[7px] text-[11.5px] font-medium text-[var(--ink)] bg-[var(--surface-subtle)] border border-[var(--border-strong)] hover:bg-[var(--hover)] transition-colors cursor-pointer animate-in fade-in duration-150"
            title="Deeply parse any nested stringified JSON fields recursively"
          >
            {i18n.t("deepParse")}
          </button>
        {/if}

        <button
          type="button"
          onclick={handleFormat}
          disabled={jsonStatus.status !== "valid"}
          class="h-7 px-2.5 rounded-[7px] text-[11.5px] font-medium text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--hover)] disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
          title={`${i18n.t("format")} (Shift+Alt+F)`}
        >
          {i18n.t("format")}
        </button>

        <button
          type="button"
          onclick={handleSortKeys}
          disabled={jsonStatus.status !== "valid"}
          class="h-7 px-2.5 rounded-[7px] text-[11.5px] font-medium text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--hover)] disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Sort JSON keys alphabetically"
        >
          {i18n.t("sortKeys")}
        </button>

        <div class="w-px h-3.5 bg-[var(--line)] mx-0.5"></div>

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
          <TooltipContent side="bottom" sideOffset={6} class="ui-tooltip-content">
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

    <!-- Zone 2: Edge-to-Edge CodeMirror Body -->
    <div class="flex-1 min-h-0 flex flex-col bg-[var(--input-bg)]">
      <JsonEditor
        bind:this={editorRef}
        bind:value={jsonValue}
        wordWrap={true}
        placeholderText={i18n.t("editorPlaceholder")}
        onSave={handleSave}
        onFormat={handleFormat}
      />
    </div>

    <!-- Zone 3: Calm Footer Bar -->
    <div
      class="px-4 py-2.5 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-none"
    >
      <div class="min-w-0 flex-1 truncate">
        {#if jsonError || jsonStatus.status === "invalid"}
          <button
            type="button"
            onclick={handleJumpToError}
            class="text-[11.5px] font-mono text-[var(--danger)] truncate max-w-full hover:underline cursor-pointer outline-none text-left"
            title={jsonError || jsonStatus.error}
          >
            {jsonError || jsonStatus.error}
          </button>
        {/if}
      </div>

      <div class="flex items-center gap-2 flex-none">
        <button
          type="button"
          onclick={handleCancel}
          class="px-3 py-1.5 rounded-[7px] bg-[var(--surface)] border border-[var(--border-color)] shadow-[var(--shadow-xs)] text-[12px] text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--ink)] hover:bg-[var(--hover)] font-medium transition-colors cursor-pointer"
        >
          {i18n.t("cancel")}
        </button>
        <button
          type="button"
          onclick={handleSave}
          class="px-3.5 py-1.5 rounded-[7px] border border-transparent text-[12px] font-medium bg-[var(--ink)] text-[var(--on-ink)] shadow-[var(--shadow-xs)] hover:opacity-88 transition-opacity cursor-pointer"
        >
          {i18n.t("save")}
        </button>
      </div>
    </div>
  </DialogContent>
</Dialog>
