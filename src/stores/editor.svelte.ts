export interface EditorTarget {}

class EditorStore {
  open = $state(true);
}

export const editorStore = new EditorStore();
