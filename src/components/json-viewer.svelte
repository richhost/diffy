<script lang="ts">
  import { getSharedHighlighter } from "@pierre/diffs";
  import type { ThemedToken } from "@pierre/diffs";
  import { themeStore } from "~/stores/theme.svelte";
  import { i18n } from "~/stores/i18n.svelte";

  interface Props {
    code: string;
    theme?: string;
    lineHeight?: number;
    maxLines?: number;
  }

  let {
    code,
    theme,
    lineHeight = 18,
    maxLines = 8,
  }: Props = $props();

  const isEmpty = $derived(!code.trim());

  const activeTheme = $derived(
    theme ?? (themeStore.isDark ? "pierre-dark" : "pierre-light"),
  );

  type TokenLine = ThemedToken[];

  async function highlight(c: string, t: string) {
    if (!c.trim()) {
      return null;
    }

    if (maxLines !== undefined) {
      const linesArr = c.split("\n");
      if (linesArr.length > maxLines) {
        c = linesArr.slice(0, maxLines + 1).join("\n");
      }
      const maxChars = maxLines * 100;
      if (c.length > maxChars) {
        c = c.substring(0, maxChars) + "\n...";
      }
    }

    const highlighter = await getSharedHighlighter({
      themes: [t, "pierre-light", "pierre-dark"],
      langs: ["json"],
    });
    const result = highlighter.codeToTokens(c, { lang: "json", theme: t });
    return {
      tokens: result.tokens as TokenLine[],
      bg: "transparent",
    };
  }

  const highlightPromise = $derived(highlight(code, activeTheme));
  const compactHeight = $derived(maxLines * lineHeight + 16);
</script>

{#if isEmpty}
  <div class="h-[64px] px-3.5 flex items-center justify-center select-none">
    <span class="text-[11px] font-mono text-[var(--ink-quaternary)]">
      {i18n.t("emptyNodeHint")}
    </span>
  </div>
{:else}
  <div
    style:height="{compactHeight}px"
    class="relative overflow-hidden font-mono text-[11px] px-3.5 py-2 bg-transparent transition-colors duration-150"
  >
    {#await highlightPromise then result}
      {#if result}
        {@const visibleLines = result.tokens.slice(0, maxLines)}
        {@const isTruncated = result.tokens.length > maxLines}
        <div class="absolute inset-0 px-3.5 py-2">
          {#each visibleLines as tokenLine, i}
            <div
              style:height="{lineHeight}px"
              style:top="{i * lineHeight + 8}px"
              class="absolute left-0 w-full flex items-center px-3.5 whitespace-pre"
            >
              {#each tokenLine as token}
                <span style:color={token.color}>{token.content}</span>
              {/each}
            </div>
          {/each}
          {#if isTruncated}
            <div
              class="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
              style="background: linear-gradient(to bottom, transparent, var(--surface-subtle));"
            ></div>
          {/if}
        </div>
      {/if}
    {/await}
  </div>
{/if}
