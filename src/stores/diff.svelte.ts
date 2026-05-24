class DiffStore {
  open = $state(false);
  sourceNodeId = $state<string | null>(null);
  targetNodeId = $state<string | null>(null);
  sourceLabel = $state("");
  targetLabel = $state("");
  sourceJson = $state("");
  targetJson = $state("");

  openDiff(
    sourceId: string,
    targetId: string,
    sourceLabel: string,
    targetLabel: string,
    sourceJson: string,
    targetJson: string,
  ) {
    this.sourceNodeId = sourceId;
    this.targetNodeId = targetId;
    this.sourceLabel = sourceLabel;
    this.targetLabel = targetLabel;
    this.sourceJson = sourceJson;
    this.targetJson = targetJson;
    this.open = true;
  }

  close() {
    this.open = false;
  }
}

export const diffStore = new DiffStore();
