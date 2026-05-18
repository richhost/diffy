<script lang="ts">
  import { Dialog } from "@ark-ui/svelte/dialog";
  import { Portal } from "@ark-ui/svelte/portal";
  import { editorStore } from "~/stores/editor.svelte";
</script>

<Dialog.Root open={editorStore.open}>
  <Portal>
    <Dialog.Backdrop
      class="fixed inset-0 z-10 bg-neutral-900/20 backdrop-blur-sm"
    />
  </Portal>
</Dialog.Root>
