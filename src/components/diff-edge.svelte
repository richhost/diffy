<script lang="ts">
  import type { EdgeProps } from "@xyflow/svelte";

  let {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    markerStart,
    style,
  }: EdgeProps = $props();
</script>
