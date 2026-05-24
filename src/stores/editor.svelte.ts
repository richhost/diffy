export interface EditorTarget {
  nodeId: string;
  label: string;
  json: string;
}

class EditorStore {
  open = $state(false);
  target = $state<EditorTarget | null>(null);

  openEditor(nodeId: string, label: string, json: string) {
    this.target = { nodeId, label, json };
    this.open = true;
  }

  close() {
    this.open = false;
    this.target = null;
  }
}

export const editorStore = new EditorStore();
