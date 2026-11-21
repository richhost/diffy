<script lang="ts">
  import Loader4 from "@tabler/icons-svelte-runes/icons/loader-4";
  import X from "@tabler/icons-svelte-runes/icons/x";
  import Check from "@tabler/icons-svelte-runes/icons/check";
  import ChevronRight from "@tabler/icons-svelte-runes/icons/chevron-right";
  import World from "@tabler/icons-svelte-runes/icons/world";
  import Plus from "@tabler/icons-svelte-runes/icons/plus";
  import Wand from "@tabler/icons-svelte-runes/icons/wand";
  import Download from "@tabler/icons-svelte-runes/icons/download";
  import Upload from "@tabler/icons-svelte-runes/icons/upload";
  import Sun from "@tabler/icons-svelte-runes/icons/sun";
  import Moon from "@tabler/icons-svelte-runes/icons/moon";
  import DeviceDesktop from "@tabler/icons-svelte-runes/icons/device-desktop";
  import HelpCircle from "@tabler/icons-svelte-runes/icons/help-circle";
  import Menu2 from "@tabler/icons-svelte-runes/icons/menu-2";
  import { graphStore, type JasonNode } from "~/stores/graph.svelte";
  import { i18n } from "~/stores/i18n.svelte";
  import { themeStore, type ThemeMode } from "~/stores/theme.svelte";
  import { helpStore } from "~/stores/help.svelte";
  import {
    SvelteFlow,
    Background,
    MiniMap,
    Controls,
    Panel,
  } from "@xyflow/svelte";
  import type {
    Connection,
    Edge,
    EdgeChangeset,
    NodeChangeset,
  } from "@xyflow/svelte";
  import {
    Menu,
    MenuTrigger,
    MenuContent,
    MenuItem,
    MenuSeparator,
    MenuSub,
    MenuSubTrigger,
    MenuSubContent,
    MenuRadioGroup,
    MenuRadioItem,
    MenuItemIndicator,
  } from "@ui-sdk/svelte/menu";
  import { Tooltip, TooltipTrigger, TooltipContent } from "@ui-sdk/svelte/tooltip";
  import ThemeToggle from "~/components/theme-toggle.svelte";
  import JsonNode from "~/components/json-node.svelte";
  import DiffEdge from "~/components/diff-edge.svelte";
  import JsonEditorDialog from "@/components/json-editor-dialog.svelte";
  import JsonDiffDialog from "@/components/json-diff-dialog.svelte";
  import HelpDialog from "@/components/help-dialog.svelte";

  const nodeTypes = { json: JsonNode };
  const edgeTypes = { diff: DiffEdge };

  $effect(() => {
    graphStore.init();
    helpStore.init();
    i18n.init();
    themeStore.init();
  });

  const isEmpty = $derived(graphStore.nodes.length === 0);

  const themeLabel = $derived(
    themeStore.mode === "dark"
      ? i18n.t("themeDark")
      : themeStore.mode === "light"
        ? i18n.t("themeLight")
        : i18n.t("themeSystem"),
  );

  const localeLabels: Record<string, string> = {
    en: "English",
    "zh-CN": "简体中文",
    "zh-TW": "繁體中文",
    ja: "日本語",
  };
  const localeLabel = $derived(localeLabels[i18n.locale] ?? "English");

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

  function handleBeforeConnect(connection: Connection): Edge {
    return {
      ...connection,
      id: `xy-edge__${connection.source}${connection.sourceHandle ?? ""}-${connection.target}${connection.targetHandle ?? ""}`,
      type: "diff",
      animated: true,
    };
  }

  function handleNodesChange(changes: NodeChangeset<JasonNode>) {
    const nextNodes = changes.applyTo(graphStore.nodes);
    const hasFinalMove = changes
      .getByType("position")
      .some((change) => change.dragging === false);
    const hasStructuralChange =
      changes.getByType("add").length > 0 ||
      changes.getByType("remove").length > 0 ||
      changes.getByType("replace").length > 0;

    changes.clear();
    if (hasFinalMove || hasStructuralChange) {
      graphStore.setNodes(nextNodes);
    } else {
      graphStore.nodes = nextNodes;
    }
  }

  function handleEdgesChange(changes: EdgeChangeset<Edge>) {
    const nextEdges = changes.applyTo(graphStore.edges);
    const shouldPersist =
      changes.getByType("add").length > 0 ||
      changes.getByType("remove").length > 0 ||
      changes.getByType("replace").length > 0;

    changes.clear();
    if (shouldPersist) {
      graphStore.setEdges(nextEdges);
    } else {
      graphStore.edges = nextEdges;
    }
  }
</script>

<div class="w-screen h-screen bg-[var(--ground)]">
  {#if graphStore.loading}
    <div class="absolute inset-0 pointer-events-none grid place-items-center">
      <Loader4 class="size-5 animate-spin text-[var(--ink-tertiary)]" />
    </div>
  {:else}
    <SvelteFlow
      proOptions={{ hideAttribution: true }}
      forceColorMode={themeStore.resolvedTheme}
      bind:nodes={graphStore.nodes}
      bind:edges={graphStore.edges}
      bind:viewport
      {nodeTypes}
      {edgeTypes}
      onbeforeconnect={handleBeforeConnect}
      onnodeschange={handleNodesChange}
      onedgeschange={handleEdgesChange}
      fitView
      fitViewOptions={{ maxZoom: 1.0, padding: "5%" }}
      defaultEdgeOptions={{ type: "diff", animated: true }}
    >
      <Background gap={24} size={1} patternColor="var(--canvas-dot)" />
      <MiniMap nodeBorderRadius={4} />
      <Controls orientation="horizontal" />

      <!-- Top-Left: Primary Canvas Actions -->
      <Panel position="top-left" class="mt-4 ml-4">
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={handleAddNode}
            class="h-8 px-3 rounded-[8px] bg-[var(--ink)] text-[var(--on-ink)] border border-transparent shadow-[var(--shadow-xs)] hover:opacity-88 transition-opacity duration-150 flex items-center gap-1.5 text-[12px] font-medium cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ground)]"
          >
            <Plus class="size-3.5" />
            <span>{i18n.t("addNode")}</span>
          </button>

          <Tooltip>
            <TooltipTrigger
              onclick={() => {
                if (!isEmpty) graphStore.autoLayout();
              }}
              aria-disabled={isEmpty || undefined}
              aria-label={i18n.t("autoLayout")}
              class="h-8 w-8 grid place-items-center rounded-[8px] border border-[var(--border-color)] bg-[var(--surface)] shadow-[var(--shadow-xs)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--ink)] hover:bg-[var(--hover)] aria-disabled:opacity-35 aria-disabled:cursor-not-allowed aria-disabled:hover:border-[var(--border-color)] aria-disabled:hover:text-[var(--ink-secondary)] aria-disabled:hover:bg-[var(--surface)] transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-active)]"
            >
              <Wand class="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} class="ui-tooltip-content">
              {i18n.t("autoLayout")}
            </TooltipContent>
          </Tooltip>
        </div>
      </Panel>

      <!-- Top-Right: Animated Theme Toggle & Workspace Menu -->
      <Panel position="top-right" class="mt-4 mr-4">
        <div class="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger
              onclick={() => themeStore.toggle()}
              aria-label={themeStore.isDark ? i18n.t("themeLight") : i18n.t("themeDark")}
              class="w-8 h-8 grid place-items-center rounded-[8px] border border-[var(--border-color)] bg-[var(--surface)] shadow-[var(--shadow-xs)] text-[var(--ink)] hover:border-[var(--border-strong)] hover:bg-[var(--hover)] transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-active)]"
            >
              <ThemeToggle toggled={themeStore.isDark} class="text-[15px]" />
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} class="ui-tooltip-content">
              {themeStore.isDark ? i18n.t("themeLight") : i18n.t("themeDark")}
            </TooltipContent>
          </Tooltip>

          <Menu>
            <MenuTrigger
              aria-label="Menu"
              class="w-8 h-8 grid place-items-center rounded-[8px] border border-[var(--border-color)] bg-[var(--surface)] shadow-[var(--shadow-xs)] text-[var(--ink)] hover:border-[var(--border-strong)] hover:bg-[var(--hover)] data-[open]:border-[var(--border-strong)] data-[open]:bg-[var(--hover)] transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-active)]"
            >
              <Menu2 class="size-4" />
            </MenuTrigger>

            <MenuContent side="bottom" align="end" sideOffset={6} class="ui-menu-content">
              <MenuItem value="import" onSelect={handleImport} class="ui-menu-item">
                <div class="flex items-center gap-2">
                  <Upload class="size-3.5 text-[var(--ink-secondary)]" />
                  <span>{i18n.t("import")}</span>
                </div>
              </MenuItem>
              <MenuItem value="export" onSelect={handleExport} class="ui-menu-item">
                <div class="flex items-center gap-2">
                  <Download class="size-3.5 text-[var(--ink-secondary)]" />
                  <span>{i18n.t("export")}</span>
                </div>
              </MenuItem>

              <MenuSeparator class="ui-menu-separator" />

              <MenuSub>
                <MenuSubTrigger class="ui-menu-item">
                  <div class="flex items-center gap-2">
                    {#if themeStore.mode === "dark"}
                      <Moon class="size-3.5 text-[var(--ink-secondary)]" />
                    {:else if themeStore.mode === "light"}
                      <Sun class="size-3.5 text-[var(--ink-secondary)]" />
                    {:else}
                      <DeviceDesktop class="size-3.5 text-[var(--ink-secondary)]" />
                    {/if}
                    <span>{i18n.t("theme")}</span>
                  </div>
                  <div class="flex items-center gap-1 text-[var(--ink-tertiary)]">
                    <span class="text-[11px]">{themeLabel}</span>
                    <ChevronRight class="size-3" />
                  </div>
                </MenuSubTrigger>
                <MenuSubContent sideOffset={4} class="ui-menu-content">
                  <MenuRadioGroup
                    name="theme"
                    value={themeStore.mode}
                    onValueChange={(v) => {
                      if (v) themeStore.setMode(v as ThemeMode);
                    }}
                  >
                    <MenuRadioItem
                      value="system"
                      label={i18n.t("themeSystem")}
                      class="ui-menu-item"
                    >
                      <div class="flex items-center gap-2">
                        <DeviceDesktop class="size-3.5 text-[var(--ink-secondary)]" />
                        <span>{i18n.t("themeSystem")}</span>
                      </div>
                      <MenuItemIndicator>
                        <Check class="size-3.5 text-[var(--ink)]" />
                      </MenuItemIndicator>
                    </MenuRadioItem>
                    <MenuRadioItem
                      value="light"
                      label={i18n.t("themeLight")}
                      class="ui-menu-item"
                    >
                      <div class="flex items-center gap-2">
                        <Sun class="size-3.5 text-[var(--ink-secondary)]" />
                        <span>{i18n.t("themeLight")}</span>
                      </div>
                      <MenuItemIndicator>
                        <Check class="size-3.5 text-[var(--ink)]" />
                      </MenuItemIndicator>
                    </MenuRadioItem>
                    <MenuRadioItem
                      value="dark"
                      label={i18n.t("themeDark")}
                      class="ui-menu-item"
                    >
                      <div class="flex items-center gap-2">
                        <Moon class="size-3.5 text-[var(--ink-secondary)]" />
                        <span>{i18n.t("themeDark")}</span>
                      </div>
                      <MenuItemIndicator>
                        <Check class="size-3.5 text-[var(--ink)]" />
                      </MenuItemIndicator>
                    </MenuRadioItem>
                  </MenuRadioGroup>
                </MenuSubContent>
              </MenuSub>

              <MenuSub>
                <MenuSubTrigger class="ui-menu-item">
                  <div class="flex items-center gap-2">
                    <World class="size-3.5 text-[var(--ink-secondary)]" />
                    <span>{localeLabel}</span>
                  </div>
                  <ChevronRight class="size-3 text-[var(--ink-tertiary)]" />
                </MenuSubTrigger>
                <MenuSubContent sideOffset={4} class="ui-menu-content">
                  <MenuRadioGroup
                    name="locale"
                    value={i18n.locale}
                    onValueChange={(v) => {
                      if (v) i18n.setLocale(v as any);
                    }}
                  >
                    <MenuRadioItem value="en" label="English" class="ui-menu-item">
                      <span>English</span>
                      <MenuItemIndicator>
                        <Check class="size-3.5 text-[var(--ink)]" />
                      </MenuItemIndicator>
                    </MenuRadioItem>
                    <MenuRadioItem value="zh-CN" label="简体中文" class="ui-menu-item">
                      <span>简体中文</span>
                      <MenuItemIndicator>
                        <Check class="size-3.5 text-[var(--ink)]" />
                      </MenuItemIndicator>
                    </MenuRadioItem>
                    <MenuRadioItem value="zh-TW" label="繁體中文" class="ui-menu-item">
                      <span>繁體中文</span>
                      <MenuItemIndicator>
                        <Check class="size-3.5 text-[var(--ink)]" />
                      </MenuItemIndicator>
                    </MenuRadioItem>
                    <MenuRadioItem value="ja" label="日本語" class="ui-menu-item">
                      <span>日本語</span>
                      <MenuItemIndicator>
                        <Check class="size-3.5 text-[var(--ink)]" />
                      </MenuItemIndicator>
                    </MenuRadioItem>
                  </MenuRadioGroup>
                </MenuSubContent>
              </MenuSub>

              <MenuSeparator class="ui-menu-separator" />

              <MenuItem value="help" onSelect={() => helpStore.openHelp()} class="ui-menu-item">
                <div class="flex items-center gap-2">
                  <HelpCircle class="size-3.5 text-[var(--ink-secondary)]" />
                  <span>{i18n.t("help")}</span>
                </div>
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </Panel>

      {#if isEmpty}
        <div
          class="pointer-events-none absolute inset-0 flex items-center justify-center p-6 animate-in fade-in duration-300"
        >
          <p class="text-[13px] text-[var(--ink-tertiary)] text-center leading-relaxed max-w-sm">
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
    class="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-3.5 py-2 rounded-[8px] bg-[var(--tooltip-bg)] text-[var(--tooltip-fg)] border border-[var(--tooltip-border)] shadow-[var(--shadow-popover)] animate-in fade-in slide-in-from-bottom-2 duration-150"
  >
    <span class="text-[12px] font-medium tracking-tight">{i18n.t("nodeDeleted")}</span>
    <div class="w-px h-3 bg-[var(--tooltip-fg)] opacity-25"></div>
    <button
      type="button"
      onclick={() => graphStore.restoreLastDeleted()}
      class="text-[12px] font-semibold underline underline-offset-2 hover:opacity-80 cursor-pointer transition-opacity duration-150"
    >
      {i18n.t("undo")}
    </button>
    <button
      type="button"
      onclick={() => graphStore.dismissUndoToast()}
      class="w-5 h-5 rounded-[4px] grid place-items-center opacity-70 hover:opacity-100 cursor-pointer transition-opacity duration-150"
      aria-label="Dismiss"
    >
      <X class="size-3" />
    </button>
  </div>
{/if}
