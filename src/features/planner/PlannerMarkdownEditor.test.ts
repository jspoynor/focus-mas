// @vitest-environment jsdom
import { Editor } from '@tiptap/core'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { createPlannerExtensions } from './plannerEditorExtensions'

/* jsdom lacks layout APIs ProseMirror's view touches during editing. */
beforeAll(() => {
  const zeroRect = {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    toJSON: () => ({}),
  }
  Range.prototype.getBoundingClientRect = () => zeroRect as DOMRect
  Range.prototype.getClientRects = () =>
    ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as unknown as DOMRectList
  Element.prototype.getClientRects = Range.prototype.getClientRects
})

let editor: Editor | null = null

afterEach(() => {
  editor?.destroy()
  editor = null
})

function createEditor(markdown: string, { editable = true } = {}) {
  editor = new Editor({
    element: document.body.appendChild(document.createElement('div')),
    extensions: createPlannerExtensions(
      '',
      () => null,
      () => false,
    ),
    content: markdown,
    contentType: 'markdown',
    editable,
  })
  return editor
}

/** Place the caret inside the list item containing the given text. */
function placeCaretIn(target: Editor, text: string) {
  let found = -1
  target.state.doc.descendants((node, pos) => {
    if (node.isText && node.text?.includes(text)) {
      found = pos + 1
    }
  })
  if (found === -1) {
    throw new Error(`text not found: ${text}`)
  }
  target.commands.setTextSelection(found)
}

function pressKey(target: Editor, key: string, options: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  })
  target.view.dom.dispatchEvent(event)
  return event
}

describe('planner editor Tab handling', () => {
  it('swallows Tab on a task item that cannot indent instead of moving focus', () => {
    const ed = createEditor('- [ ] one\n- [ ] two')
    placeCaretIn(ed, 'one')
    const event = pressKey(ed, 'Tab')
    expect(event.defaultPrevented).toBe(true)
    expect(ed.getMarkdown()).toBe('- [ ] one\n- [ ] two')
  })

  it('still indents a task item that has a sibling above it', () => {
    const ed = createEditor('- [ ] one\n- [ ] two')
    placeCaretIn(ed, 'two')
    const event = pressKey(ed, 'Tab')
    expect(event.defaultPrevented).toBe(true)
    expect(ed.getMarkdown()).toBe('- [ ] one\n  - [ ] two')
  })

  it('swallows Tab in a bullet list and in a plain paragraph', () => {
    const ed = createEditor('- one\n- two\n\nparagraph')
    placeCaretIn(ed, 'one')
    expect(pressKey(ed, 'Tab').defaultPrevented).toBe(true)
    placeCaretIn(ed, 'paragraph')
    expect(pressKey(ed, 'Tab').defaultPrevented).toBe(true)
    expect(ed.getMarkdown()).toBe('- one\n- two\n\nparagraph')
  })

  it('swallows Shift-Tab on a top-level item and still outdents a nested one', () => {
    const ed = createEditor('- [ ] one\n  - [ ] two')
    placeCaretIn(ed, 'one')
    expect(pressKey(ed, 'Tab', { shiftKey: true }).defaultPrevented).toBe(true)
    expect(ed.getMarkdown()).toBe('- [ ] one\n  - [ ] two')

    placeCaretIn(ed, 'two')
    expect(pressKey(ed, 'Tab', { shiftKey: true }).defaultPrevented).toBe(true)
    expect(ed.getMarkdown()).toBe('- [ ] one\n- [ ] two')
  })

  it('consumes Escape as the keyboard exit and blurs synchronously', () => {
    const ed = createEditor('- [ ] one')
    placeCaretIn(ed, 'one')
    let blurred = false
    ed.view.dom.blur = () => {
      blurred = true
    }
    const event = pressKey(ed, 'Escape')
    expect(event.defaultPrevented).toBe(true)
    expect(blurred).toBe(true)
  })

  it('leaves Tab native in read-only mode so checkboxes stay reachable', () => {
    const ed = createEditor('- [ ] one\n- [ ] two', { editable: false })
    const event = pressKey(ed, 'Tab')
    expect(event.defaultPrevented).toBe(false)
    expect(ed.getMarkdown()).toBe('- [ ] one\n- [ ] two')
  })
})
