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
import { EditorContent, useEditor } from '@tiptap/react'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'

export interface PlannerMarkdownEditorProps {
  className?: string
  value: string
  onChange: (nextValue: string) => void
  readOnly?: boolean
  placeholder?: string
  'aria-label'?: string
}

export interface PlannerMarkdownEditorHandle {
  commit: () => void
}

function createPlannerExtensions(placeholder: string) {
  return [
    Document,
    Paragraph,
    Text,
    BulletList,
    OrderedList,
    ListItem,
    TaskList,
    TaskItem.configure({ nested: true }),
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
    placeholder = '',
    'aria-label': ariaLabel,
  },
  ref,
) {
  const lastEmittedRef = useRef<string | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)

  const extensions = useMemo(() => createPlannerExtensions(placeholder), [placeholder])

  const commitEditorValue = () => {
    const activeEditor = editorRef.current
    if (!activeEditor || activeEditor.isDestroyed || !activeEditor.isEditable) {
      return
    }
    const markdown = activeEditor.getMarkdown()
    lastEmittedRef.current = markdown
    onChangeRef.current(markdown)
  }

  const editor = useEditor({
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
  })

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
    <div className="planner-markdown-editor flex min-h-0 flex-1 flex-col overflow-y-auto">
      <EditorContent
        editor={editor}
        className={`${className} planner-markdown-editor__content`}
      />
    </div>
  )
})
