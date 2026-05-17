<script lang="ts">
  import { getSharedHighlighter } from "@pierre/diffs";
  import type { ThemedToken } from "@pierre/diffs";

  interface Props {
    code: string;
    theme?: string;
    lineHeight?: number;
    maxLines?: number;
  }

  let {
    code,
    theme = "pierre-dark",
    lineHeight = 20,
    maxLines = 7,
  }: Props = $props();

  type TokenLine = ThemedToken[];

  let lines = $state<TokenLine[]>([]);
  let bg = $state("#1e1e1e");

  $effect(() => {
    loadTokens(code, theme);
  });

  async function loadTokens(c: string, t: string) {
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
      themes: [t],
      langs: ["json"],
    });
    const result = highlighter.codeToTokens(c, { lang: "json", theme: t });
    lines = result.tokens;
    bg = result.bg ?? "#1e1e1e";
  }

  const visibleLines = $derived(lines.slice(0, maxLines));
  const isTruncated = $derived(lines.length > maxLines);
  const compactHeight = $derived(maxLines * lineHeight);
</script>

<div
  style:height="{compactHeight}px"
  style:background={bg}
  class="relative overflow-hidden font-mono text-[10px]"
>
  {#each visibleLines as tokenLine, i}
    <div
      style:height="{lineHeight}px"
      style:top="{i * lineHeight}px"
      class="absolute left-0 w-full flex items-center px-2 whitespace-pre"
    >
      {#each tokenLine as token}
        <span style:color={token.color}>{token.content}</span>
      {/each}
    </div>
  {/each}
  {#if isTruncated}
    <div
      class="absolute bottom-0 left-0 right-0 h-5 pointer-events-none"
      style="background: linear-gradient(to bottom, transparent, {bg});"
    ></div>
  {/if}
</div>
