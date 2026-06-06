<script lang="ts">
  import { Dialog } from "@ark-ui/svelte/dialog";
  import { Portal } from "@ark-ui/svelte/portal";
  import { helpStore } from "~/stores/help.svelte";
  import X from "@tabler/icons-svelte-runes/icons/x";
  import ChevronLeft from "@tabler/icons-svelte-runes/icons/chevron-left";
  import ChevronRight from "@tabler/icons-svelte-runes/icons/chevron-right";

  let currentStep = $state(0);
  const totalSteps = 4;

  $effect(() => {
    if (helpStore.open) {
      currentStep = 0;
    }
  });

  function handleNext() {
    if (currentStep < totalSteps - 1) {
      currentStep++;
    } else {
      helpStore.close();
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      currentStep--;
    }
  }

  function handleSkip() {
    helpStore.close();
  }
</script>

<Dialog.Root
  open={helpStore.open}
  onOpenChange={(e) => {
    if (!e.open) helpStore.close();
  }}
>
  <Portal>
    <!-- Backdrop -->
    <Dialog.Backdrop
      class="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200"
    />

    <Dialog.Positioner
      class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <Dialog.Content
        class="w-full max-w-md bg-white rounded-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#1d1d1f] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
        style="box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.08);"
      >
        <!-- Header -->
        <div class="px-6 pt-5 pb-4 flex justify-between items-center flex-none">
          <Dialog.Title class="text-[13px] font-semibold text-[#6e6e73] tracking-tight uppercase">
            Guide • {currentStep + 1} of {totalSteps}
          </Dialog.Title>
          <Dialog.CloseTrigger
            onclick={handleSkip}
            class="w-7 h-7 grid place-items-center rounded-full text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/6 transition-all cursor-pointer -mr-1 -mt-0.5"
            aria-label="Close"
          >
            <X class="size-4" />
          </Dialog.CloseTrigger>
        </div>

        <!-- Body / Content -->
        <div class="px-6 pb-6 flex-1 flex flex-col gap-6 items-center text-center">
          
          <!-- Step Illustration Frame -->
          <div class="w-full h-44 bg-[#f5f5f7] rounded-xl flex items-center justify-center overflow-hidden border border-black/5 relative select-none">
            {#if currentStep === 0}
              <!-- Step 0 Illustration: Add & Edit Nodes -->
              <div class="flex items-center gap-3 animate-in fade-in duration-300">
                <div class="w-28 h-24 bg-white rounded-lg border border-black/8 shadow-sm flex flex-col overflow-hidden relative">
                  <div class="h-5 bg-[#fafafa] border-b border-black/5 px-2 flex items-center justify-between">
                    <span class="text-[8px] font-bold text-[#1d1d1f]">JSON Node</span>
                    <span class="w-2.5 h-2.5 rounded bg-black/5 flex items-center justify-center">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#0071e3]/40"></span>
                    </span>
                  </div>
                  <div class="p-2 flex flex-col gap-1 font-mono text-[6px] text-[#aeaeb2] text-left">
                    <span class="text-[#0071e3]">"id"</span>
                    <span class="text-[#24292f]">"name": "User"</span>
                  </div>
                  <div class="absolute inset-0 bg-[#0071e3]/5 border border-[#0071e3] rounded-lg animate-pulse"></div>
                </div>
                <!-- Add Button graphic -->
                <div class="flex flex-col items-center gap-1.5 bg-white border border-black/8 shadow-sm p-3 rounded-lg">
                  <span class="w-7 h-7 rounded-full bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3]">
                    ＋
                  </span>
                  <span class="text-[9px] font-medium text-[#1d1d1f]">Add Node</span>
                </div>
              </div>

            {:else if currentStep === 1}
              <!-- Step 1 Illustration: Drag to Connect -->
              <div class="flex items-center justify-between w-full px-12 relative animate-in fade-in duration-300">
                <!-- Source Node -->
                <div class="w-20 h-16 bg-white rounded-lg border border-black/8 shadow-sm flex flex-col overflow-hidden relative">
                  <div class="h-4 bg-[#fafafa] border-b border-black/5 px-1.5 flex items-center">
                    <span class="text-[7px] font-semibold text-[#1d1d1f]">Before</span>
                  </div>
                  <!-- Right Handle -->
                  <div class="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border border-black/20 shadow-sm flex items-center justify-center">
                    <div class="w-1 h-1 rounded-full bg-[#0071e3] animate-ping"></div>
                  </div>
                </div>

                <!-- Animated Connection Line -->
                <svg class="absolute inset-0 w-full h-full pointer-events-none z-10">
                  <path
                    d="M 124 88 Q 170 88 220 88"
                    fill="none"
                    stroke="#0071e3"
                    stroke-width="1.5"
                    stroke-dasharray="4"
                    class="animate-[dash_1s_linear_infinite]"
                  />
                </svg>

                <!-- Target Node -->
                <div class="w-20 h-16 bg-white rounded-lg border border-black/8 shadow-sm flex flex-col overflow-hidden relative">
                  <div class="h-4 bg-[#fafafa] border-b border-black/5 px-1.5 flex items-center">
                    <span class="text-[7px] font-semibold text-[#1d1d1f]">After</span>
                  </div>
                  <!-- Left Handle -->
                  <div class="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border border-black/20 shadow-sm"></div>
                </div>
              </div>

            {:else if currentStep === 2}
              <!-- Step 2 Illustration: Compare Diff -->
              <div class="flex flex-col items-center gap-3 relative w-full animate-in fade-in duration-300">
                <div class="flex items-center gap-12 relative">
                  <div class="w-16 h-12 bg-white rounded border border-black/8 shadow-sm"></div>
                  <div class="w-16 h-12 bg-white rounded border border-black/8 shadow-sm"></div>
                  
                  <!-- Connection line with Compare badge -->
                  <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div class="w-[120px] h-0.5 bg-black/10 relative flex items-center justify-center">
                      <span class="bg-[#0071e3] text-white text-[7px] font-semibold px-2 py-0.5 rounded-full shadow-md animate-bounce">
                        Compare
                      </span>
                    </div>
                  </div>
                </div>
                
                <!-- Mini side-by-side diff preview -->
                <div class="w-52 h-14 bg-white border border-black/8 rounded-lg shadow-sm overflow-hidden flex font-mono text-[5px] text-left">
                  <div class="flex-1 p-1 bg-red-50/50 border-r border-black/5 flex flex-col gap-0.5">
                    <span class="text-red-500 font-bold">- "role": "viewer"</span>
                  </div>
                  <div class="flex-1 p-1 bg-green-50/50 flex flex-col gap-0.5">
                    <span class="text-green-600 font-bold">+ "role": "admin"</span>
                  </div>
                </div>
              </div>

            {:else}
              <!-- Step 3 Illustration: Export/Import -->
              <div class="flex items-center gap-6 animate-in fade-in duration-300">
                <div class="flex flex-col items-center gap-1">
                  <div class="w-10 h-10 rounded-lg bg-white border border-black/8 shadow-sm flex items-center justify-center text-[#6e6e73]">
                    ↑
                  </div>
                  <span class="text-[8px] font-medium text-[#6e6e73]">Import</span>
                </div>
                <div class="w-16 h-20 bg-white border border-black/8 rounded shadow-sm flex flex-col items-center justify-center gap-1.5 relative">
                  <span class="text-[12px] font-bold text-[#1d1d1f]">JSON</span>
                  <div class="w-8 h-1 bg-black/5 rounded"></div>
                  <div class="w-6 h-1 bg-black/5 rounded"></div>
                </div>
                <div class="flex flex-col items-center gap-1">
                  <div class="w-10 h-10 rounded-lg bg-[#0071e3]/10 border border-[#0071e3]/20 shadow-sm flex items-center justify-center text-[#0071e3] font-bold">
                    ↓
                  </div>
                  <span class="text-[8px] font-medium text-[#0071e3]">Export</span>
                </div>
              </div>
            {/if}
          </div>

          <!-- Step Description -->
          <div class="flex flex-col gap-2">
            {#if currentStep === 0}
              <h2 class="text-base font-semibold text-[#1d1d1f] tracking-tight">
                Create & Edit JSON Nodes
              </h2>
              <p class="text-[13px] text-[#6e6e73] leading-relaxed max-w-xs">
                Click <span class="text-[#0071e3] font-semibold">Add Node</span> in the toolbar to create a JSON card. Hover any node and click the <b>code icon</b> to edit its label and JSON values.
              </p>
            {:else if currentStep === 1}
              <h2 class="text-base font-semibold text-[#1d1d1f] tracking-tight">
                Connect Nodes
              </h2>
              <p class="text-[13px] text-[#6e6e73] leading-relaxed max-w-xs">
                Link cards together by dragging a line from the <b>right handle</b> (source) of one card and dropping it onto the <b>left handle</b> (target) of another.
              </p>
            {:else if currentStep === 2}
              <h2 class="text-base font-semibold text-[#1d1d1f] tracking-tight">
                Compare JSON Differences
              </h2>
              <p class="text-[13px] text-[#6e6e73] leading-relaxed max-w-xs">
                Once connected, a <span class="text-[#0071e3] font-semibold">Compare</span> button will appear on the connection edge. Click it to open a side-by-side or unified diff comparison.
              </p>
            {:else}
              <h2 class="text-base font-semibold text-[#1d1d1f] tracking-tight">
                Import & Export Graphs
              </h2>
              <p class="text-[13px] text-[#6e6e73] leading-relaxed max-w-xs">
                Save your workspace structure and JSON details to a file by clicking <b>Export</b>. You can reload your saved file anytime using <b>Import</b>.
              </p>
            {/if}
          </div>

          <!-- Progress dot indicators -->
          <div class="flex items-center gap-1.5 mt-2 flex-none">
            {#each Array(totalSteps) as _, i}
              <button
                onclick={() => (currentStep = i)}
                class="w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer {currentStep === i ? 'w-4 bg-[#0071e3]' : 'bg-black/15'}"
                aria-label="Go to slide {i + 1}"
              ></button>
            {/each}
          </div>
        </div>

        <!-- Footer / Navigation -->
        <div class="px-6 pb-5 flex items-center justify-between border-t border-black/5 pt-4 flex-none">
          <button
            onclick={handleSkip}
            class="text-[12px] font-medium text-[#8e8e93] hover:text-[#1d1d1f] transition-colors cursor-pointer"
          >
            Skip
          </button>
          
          <div class="flex items-center gap-2">
            {#if currentStep > 0}
              <button
                onclick={handlePrev}
                class="w-8 h-8 rounded-lg bg-black/5 hover:bg-black/8 text-[#1d1d1f] flex items-center justify-center transition-all cursor-pointer"
                aria-label="Previous step"
              >
                <ChevronLeft class="size-4" />
              </button>
            {/if}
            <button
              onclick={handleNext}
              class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium text-white transition-all cursor-pointer hover:opacity-90 active:scale-[0.98]"
              style="background: #0071e3;"
            >
              {#if currentStep === totalSteps - 1}
                Get Started
              {:else}
                Next
                <ChevronRight class="size-3.5" />
              {/if}
            </button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog.Root>

<style>
  @keyframes dash {
    to {
      stroke-dashoffset: -8;
    }
  }
</style>
