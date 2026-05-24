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

  async function highlight(c: string, t: string) {
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
    return {
      tokens: result.tokens as TokenLine[],
      bg: result.bg ?? "#1e1e1e",
    };
  }

  const highlightPromise = $derived(highlight(code, theme));
  const compactHeight = $derived(maxLines * lineHeight);
</script>

<div
  style:height="{compactHeight}px"
  class="relative overflow-hidden font-mono text-[10px]"
>
  {#await highlightPromise then result}
    {@const visibleLines = result.tokens.slice(0, maxLines)}
    {@const isTruncated = result.tokens.length > maxLines}
    <div class="absolute inset-0" style:background={result.bg}>
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
          style="background: linear-gradient(to bottom, transparent, {result.bg});"
        ></div>
      {/if}
    </div>
  {/await}
</div>
