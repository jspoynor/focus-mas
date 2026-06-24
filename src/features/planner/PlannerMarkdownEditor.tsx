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
import { EditorContent, useEditor } from '@tiptap/react'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'

export interface PlannerMarkdownEditorProps {
  className?: string
  value: string
  onChange: (nextValue: string) => void
  readOnly?: boolean
  /** When read-only, still allow toggling task list checkboxes. */
  checkboxesEditable?: boolean
  placeholder?: string
  'aria-label'?: string
}

export interface PlannerMarkdownEditorHandle {
  commit: () => void
}

function toggleReadOnlyTaskItem(
  node: ProseMirrorNode,
  checked: boolean,
  getEditor: () => ReturnType<typeof useEditor> | null,
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

function createPlannerExtensions(
  placeholder: string,
  getEditor: () => ReturnType<typeof useEditor> | null,
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
    Placeholder.configure({ placeholder }),
    Markdown.configure({
      markedOptions: { gfm: true },
    }),
  ]
}

export const PlannerMarkdownEditor = forwardRef<
  PlannerMarkdownEditorHandle,
  PlannerMarkdownEditorProps
>(function PlannerMarkdownEditor(
  {
    className = '',
    value,
    onChange,
    readOnly = false,
    checkboxesEditable = false,
    placeholder = '',
    'aria-label': ariaLabel,
  },
  ref,
) {
  const lastEmittedRef = useRef<string | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)
  const checkboxesEditableRef = useRef(checkboxesEditable)
  checkboxesEditableRef.current = checkboxesEditable

  const extensions = useMemo(
    () =>
      createPlannerExtensions(
        placeholder,
        () => editorRef.current,
        () => checkboxesEditableRef.current,
      ),
    [placeholder],
  )

  const commitEditorValue = () => {
    const activeEditor = editorRef.current
    if (!activeEditor || activeEditor.isDestroyed) {
      return
    }
    if (!activeEditor.isEditable && !checkboxesEditableRef.current) {
      return
    }
    const markdown = activeEditor.getMarkdown()
    lastEmittedRef.current = markdown
    onChangeRef.current(markdown)
  }

  const editor = useEditor(
    {
      extensions,
      content: value,
      contentType: 'markdown',
      editable: !readOnly,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          role: 'textbox',
          'aria-multiline': 'true',
          ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
        },
      },
      onUpdate: ({ editor: activeEditor }) => {
        const markdown = activeEditor.getMarkdown()
        lastEmittedRef.current = markdown
        onChangeRef.current(markdown)
      },
    },
    [extensions, readOnly, checkboxesEditable],
  )

  editorRef.current = editor

  useImperativeHandle(
    ref,
    () => ({
      commit: commitEditorValue,
    }),
    [editor],
  )

  useEffect(() => {
    if (!editor) {
      return
    }
    editor.setEditable(!readOnly)
  }, [editor, readOnly])

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return
    }

    const editorElement = editor.view.dom
    const handleBlur = () => {
      commitEditorValue()
    }

    editorElement.addEventListener('blur', handleBlur)
    return () => {
      editorElement.removeEventListener('blur', handleBlur)
    }
  }, [editor])

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return
    }

    if (lastEmittedRef.current === value) {
      return
    }

    const currentMarkdown = editor.getMarkdown()
    if (currentMarkdown === value) {
      lastEmittedRef.current = value
      return
    }

    editor.commands.setContent(value, { contentType: 'markdown', emitUpdate: false })
    lastEmittedRef.current = value
  }, [editor, value])

  return (
    <div
      className={`planner-markdown-editor flex min-h-0 flex-1 flex-col overflow-y-auto${
        readOnly && checkboxesEditable ? ' planner-markdown-editor--checkboxes-editable' : ''
      }`}
    >
      <EditorContent
        editor={editor}
        className={`${className} planner-markdown-editor__content`}
      />
    </div>
  )
})
