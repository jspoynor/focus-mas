import { Extension } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import {
  BulletList,
  ListItem,
  ListKeymap,
  OrderedList,
  TaskItem,
  TaskList,
} from '@tiptap/extension-list'
import Paragraph from '@tiptap/extension-paragraph'
import Placeholder from '@tiptap/extension-placeholder'
import Text from '@tiptap/extension-text'
import { Markdown } from '@tiptap/markdown'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { useEditor } from '@tiptap/react'

type MaybeEditor = ReturnType<typeof useEditor> | null

function toggleReadOnlyTaskItem(
  node: ProseMirrorNode,
  checked: boolean,
  getEditor: () => MaybeEditor,
): boolean {
  const activeEditor = getEditor()
  if (!activeEditor || activeEditor.isDestroyed) {
    return false
  }

  let updated = false
  activeEditor.state.doc.descendants((subnode, pos) => {
    if (updated || subnode.type.name !== 'taskItem') {
      return
    }
    if (subnode.textContent === node.textContent && subnode.attrs.checked !== checked) {
      const tr = activeEditor.state.tr.setNodeMarkup(pos, undefined, {
        ...subnode.attrs,
        checked,
      })
      activeEditor.view.dispatch(tr)
      updated = true
    }
  })

  return updated
}

/**
 * While the editor is editable, Tab must never move browser focus: the list
 * extensions' own Tab handlers return false when an item cannot sink/lift
 * (e.g. the first item in a list), which lets native focus navigation kick in
 * and land on the next task checkbox. This guard runs first (priority above
 * the default 100), performs the indent/outdent itself, and always consumes
 * the key. Escape is the deliberate keyboard exit; its blur also fires the
 * editor's blur-commit. Read-only mode is untouched — ProseMirror skips edit
 * keymaps there, so checkboxes stay reachable by native Tab — but the
 * isEditable check makes that explicit.
 */
const TabIndentGuard = Extension.create({
  name: 'plannerTabIndentGuard',
  priority: 1000,
  addKeyboardShortcuts() {
    /*
     * liftListItem on a top-level item does not fail — it converts the item
     * to a paragraph. Outdent should be a no-op at top level, so only lift
     * when the caret sits inside a nested list item.
     */
    const isSelectionNested = () => {
      const { $from } = this.editor.state.selection
      let listDepth = 0
      for (let depth = $from.depth; depth > 0; depth -= 1) {
        const name = $from.node(depth).type.name
        if (name === 'taskItem' || name === 'listItem') {
          listDepth += 1
        }
      }
      return listDepth >= 2
    }

    return {
      Tab: () => {
        if (!this.editor.isEditable) {
          return false
        }
        this.editor.commands.first(({ commands }) => [
          () => commands.sinkListItem('taskItem'),
          () => commands.sinkListItem('listItem'),
        ])
        return true
      },
      'Shift-Tab': () => {
        if (!this.editor.isEditable) {
          return false
        }
        if (isSelectionNested()) {
          this.editor.commands.first(({ commands }) => [
            () => commands.liftListItem('taskItem'),
            () => commands.liftListItem('listItem'),
          ])
        }
        return true
      },
      Escape: () => {
        if (!this.editor.isEditable) {
          return false
        }
        /*
         * Not commands.blur(): that defers to requestAnimationFrame, which
         * browsers throttle in hidden/occluded windows, leaving Escape a
         * no-op there. A synchronous blur also fires the blur-commit before
         * anything else can run.
         */
        this.editor.view.dom.blur()
        window.getSelection()?.removeAllRanges()
        return true
      },
    }
  },
})

export function createPlannerExtensions(
  placeholder: string,
  getEditor: () => MaybeEditor,
  getCheckboxesEditable: () => boolean,
) {
  return [
    Document,
    Paragraph,
    Text,
    BulletList,
    OrderedList,
    ListItem,
    TaskList,
    TaskItem.configure({
      nested: true,
      onReadOnlyChecked: (node, checked) => {
        if (!getCheckboxesEditable()) {
          return false
        }
        return toggleReadOnlyTaskItem(node, checked, getEditor)
      },
    }),
    ListKeymap,
    TabIndentGuard,
    Placeholder.configure({ placeholder }),
    Markdown.configure({
      markedOptions: { gfm: true },
    }),
  ]
}
