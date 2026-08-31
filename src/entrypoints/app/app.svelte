<script lang="ts">
  import { onMount } from "svelte";
  import Loader4 from "@tabler/icons-svelte-runes/icons/loader-4";
  import X from "@tabler/icons-svelte-runes/icons/x";
  import { graphStore } from "~/stores/graph.svelte";
  import { i18n } from "~/stores/i18n.svelte";
  import { themeStore } from "~/stores/theme.svelte";
  import {
    SvelteFlow,
    Background,
    MiniMap,
    Controls,
    Panel,
    addEdge,
  } from "@xyflow/svelte";
  import type { Connection } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import Plus from "@tabler/icons-svelte-runes/icons/plus";
  import Wand from "@tabler/icons-svelte-runes/icons/wand";
  import Download from "@tabler/icons-svelte-runes/icons/download";
  import Upload from "@tabler/icons-svelte-runes/icons/upload";
  import Sun from "@tabler/icons-svelte-runes/icons/sun";
  import Moon from "@tabler/icons-svelte-runes/icons/moon";
  import DeviceDesktop from "@tabler/icons-svelte-runes/icons/device-desktop";
  import JsonNode from "~/components/json-node.svelte";
  import DiffEdge from "~/components/diff-edge.svelte";
  import JsonEditorDialog from "@/components/json-editor-dialog.svelte";
  import JsonDiffDialog from "@/components/json-diff-dialog.svelte";
  import { helpStore } from "~/stores/help.svelte";
  import HelpDialog from "@/components/help-dialog.svelte";
  import HelpCircle from "@tabler/icons-svelte-runes/icons/help-circle";

  const nodeTypes = { json: JsonNode };
  const edgeTypes = { diff: DiffEdge };

  $effect(() => {
    graphStore.init();
    helpStore.init();
    i18n.init();
    themeStore.init();
  });

  const isEmpty = $derived(graphStore.nodes.length === 0);

  let viewport = $state({ x: 0, y: 0, zoom: 1 });
  let spawnCount = 0;

  function handleAddNode() {
    const offset = (spawnCount % 6) * 30;
    spawnCount++;

    const x =
      (window.innerWidth / 2 - 128 - viewport.x) / viewport.zoom + offset;
    const y =
      (window.innerHeight / 2 - 80 - viewport.y) / viewport.zoom + offset;
    graphStore.addNode({ x, y });
  }

  function handleExport() {
    const json = graphStore.exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diffy-graph.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        graphStore.importJSON(text);
      } catch (err) {
        alert("Invalid JSON graph format");
      }
    };
    input.click();
  }
  function handleConnect(connection: Connection) {
    graphStore.setEdges(
      addEdge(
        { ...connection, type: "diff", animated: true },
        graphStore.edges,
      ),
    );
  }
  function handleNodeDragStop() {
    graphStore.setNodes(graphStore.nodes);
  }
</script>

<div class="w-screen h-screen">
  {#if graphStore.loading}
    <div class="absolute inset-0 pointer-events-none grid place-items-center">
      <Loader4 class="size-5 animate-spin text-[#aeaeb2]" />
    </div>
  {:else}
    <SvelteFlow
      proOptions={{ hideAttribution: true }}
      colorMode={themeStore.resolvedTheme}
      bind:nodes={graphStore.nodes}
      bind:edges={graphStore.edges}
      bind:viewport
      {nodeTypes}
      {edgeTypes}
      onconnect={handleConnect}
      onnodedragstop={handleNodeDragStop}
      fitView
      fitViewOptions={{ maxZoom: 1.0, padding: 0.1 }}
      defaultEdgeOptions={{ type: "diff", animated: true }}
    >
      <Background
        gap={24}
        size={1}
        patternColor={themeStore.isDark ? "#27272a" : "#d4d4d8"}
      />
      <MiniMap />
      <Controls />

      <!-- Toolbar pill -->
      <Panel position="top-left" class="mt-4 ml-4">
        <div
          class="flex items-center bg-surface rounded-md shadow-[0_2px_8px_var(--color-shadow),0_0_0_0.5px_var(--color-border)] overflow-hidden transition-colors duration-150"
        >
          <button
            onclick={handleAddNode}
            class="flex items-center gap-1.5 px-4 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-bg)] transition-colors duration-150 cursor-pointer text-[12px] font-medium tracking-tight"
          >
            <Plus class="size-3.5 text-[var(--color-primary)]" />
            {i18n.t("addNode")}
          </button>
          <div class="w-px h-4 bg-[var(--color-border)]"></div>
          <button
            onclick={() => graphStore.autoLayout()}
            disabled={graphStore.nodes.length === 0}
            class="flex items-center gap-1.5 px-4 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer text-[12px] font-medium tracking-tight"
            title={i18n.t("autoLayout")}
          >
            <Wand class="size-3.5 text-[var(--color-text-secondary)]" />
            {i18n.t("autoLayout")}
          </button>
          <div class="w-px h-4 bg-[var(--color-border)]"></div>
          <button
            onclick={handleImport}
            class="flex items-center gap-1.5 px-4 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-bg)] transition-colors duration-150 cursor-pointer text-[12px] font-medium tracking-tight"
          >
            <Upload class="size-3.5 text-[var(--color-text-secondary)]" />
            {i18n.t("import")}
          </button>
          <div class="w-px h-4 bg-[var(--color-border)]"></div>
          <button
            onclick={handleExport}
            class="flex items-center gap-1.5 px-4 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-bg)] transition-colors duration-150 cursor-pointer text-[12px] font-medium tracking-tight"
          >
            <Download class="size-3.5 text-[var(--color-text-secondary)]" />
            {i18n.t("export")}
          </button>
          <div class="w-px h-4 bg-[var(--color-border)]"></div>
          <button
            onclick={() => helpStore.openHelp()}
            class="flex items-center gap-1.5 px-4 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-bg)] transition-colors duration-150 cursor-pointer text-[12px] font-medium tracking-tight"
          >
            <HelpCircle class="size-3.5 text-[var(--color-text-secondary)]" />
            {i18n.t("help")}
          </button>
          <div class="w-px h-4 bg-[var(--color-border)]"></div>

          <!-- Theme switcher -->
          <div class="relative flex items-center pr-3">
            <div class="pl-3 pointer-events-none flex items-center text-[var(--color-text-secondary)]">
              {#if themeStore.mode === "dark"}
                <Moon class="size-3.5" />
              {:else if themeStore.mode === "light"}
                <Sun class="size-3.5" />
              {:else}
                <DeviceDesktop class="size-3.5" />
              {/if}
            </div>
            <select
              value={themeStore.mode}
              onchange={(e) => themeStore.setMode((e.target as HTMLSelectElement).value as any)}
              class="appearance-none bg-transparent pl-2 pr-6 py-2 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] outline-none cursor-pointer transition-colors duration-150"
              aria-label={i18n.t("theme")}
            >
              <option value="system">{i18n.t("themeSystem")}</option>
              <option value="light">{i18n.t("themeLight")}</option>
              <option value="dark">{i18n.t("themeDark")}</option>
            </select>
            <svg
              class="size-3 text-[var(--color-text-tertiary)] absolute right-2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>

          <div class="w-px h-4 bg-[var(--color-border)]"></div>

          <!-- Language switcher -->
          <div class="relative flex items-center pr-3">
            <select
              value={i18n.locale}
              onchange={(e) => i18n.setLocale((e.target as HTMLSelectElement).value as any)}
              class="appearance-none bg-transparent pl-3 pr-6 py-2 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] outline-none cursor-pointer transition-colors duration-150"
            >
              <option value="en">English</option>
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁體中文</option>
              <option value="ja">日本語</option>
            </select>
            <svg
              class="size-3 text-[var(--color-text-tertiary)] absolute right-2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </Panel>

      {#if isEmpty}
        <div
          class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <p class="text-[13px] text-[var(--color-text-secondary)] text-center leading-relaxed max-w-sm px-4">
            {i18n.t("emptyState")}
          </p>
        </div>
      {/if}
    </SvelteFlow>
  {/if}
</div>
<JsonEditorDialog />
<JsonDiffDialog />
<HelpDialog />

{#if graphStore.showUndoToast}
  <div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-text-primary text-surface rounded-[var(--radius-md)] shadow-[0_4px_16px_var(--color-shadow),0_0_0_0.5px_var(--color-border)] animate-in fade-in slide-in-from-bottom-4 duration-200"
  >
    <span class="text-[12px] font-medium tracking-tight">{i18n.t("nodeDeleted")}</span>
    <div class="w-px h-3 bg-surface opacity-20"></div>
    <button
      onclick={() => graphStore.restoreLastDeleted()}
      class="text-[12px] font-bold text-primary hover:underline cursor-pointer transition-colors duration-150"
    >
      {i18n.t("undo")}
    </button>
    <button
      onclick={() => graphStore.dismissUndoToast()}
      class="text-text-tertiary hover:text-surface ml-1 cursor-pointer transition-colors duration-150 p-0.5 rounded-full hover:bg-surface/10"
      aria-label="Dismiss"
    >
      <X class="size-3" />
    </button>
  </div>
{/if}
