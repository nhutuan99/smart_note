<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Typography from '@tiptap/extension-typography'
import Highlight from '@tiptap/extension-highlight'
import { createLowlight, common } from 'lowlight'
import { watch, onBeforeUnmount, ref } from 'vue'
import {
  Bold, Italic, Strikethrough, Code, Link2, Image as ImageIcon,
  List, ListOrdered, ListChecks, Quote, Minus, Undo, Redo,
  Heading1, Heading2, Heading3, Highlighter, Code2, ImagePlus
} from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const lowlight = createLowlight(common)

// Link dialog
const showLinkDialog = ref(false)
const linkUrl = ref('')
const linkInput = ref<HTMLInputElement | null>(null)

// Image dialog
const showImageDialog = ref(false)
const imageUrl = ref('')
const imageInput = ref<HTMLInputElement | null>(null)

const editor = useEditor({
  content: props.modelValue,
  editable: !props.readonly,
  extensions: [
    StarterKit.configure({
      codeBlock: false,
    }),
    CodeBlockLowlight.configure({ lowlight }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' }
    }),
    Image.configure({ allowBase64: true }),
    Placeholder.configure({ placeholder: 'Start writing... (supports rich text, links, images)' }),
    CharacterCount,
    TaskList,
    TaskItem.configure({ nested: true }),
    Typography,
    Highlight.configure({ multicolor: false }),
  ],
  onUpdate({ editor }) {
    emit('update:modelValue', editor.getHTML())
  },
  editorProps: {
    handlePaste(view, event) {
      const items = event.clipboardData?.items
      if (!items) return false
      
      let hasImage = false
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            hasImage = true
            const reader = new FileReader()
            reader.onload = (e) => {
              const src = e.target?.result as string
              editor.value?.chain().focus().setImage({ src }).run()
            }
            reader.readAsDataURL(file)
          }
        }
      }
      return hasImage
    }
  }
})

watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val)
  }
})

onBeforeUnmount(() => editor.value?.destroy())

// ── Toolbar Actions ──

function openLinkDialog() {
  const prevUrl = editor.value?.getAttributes('link').href || ''
  linkUrl.value = prevUrl
  showLinkDialog.value = true
  setTimeout(() => linkInput.value?.focus(), 50)
}

function applyLink() {
  if (!linkUrl.value.trim()) {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
  } else {
    const href = linkUrl.value.startsWith('http') ? linkUrl.value : `https://${linkUrl.value}`
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href }).run()
  }
  showLinkDialog.value = false
  linkUrl.value = ''
}

function openImageDialog() {
  imageUrl.value = ''
  showImageDialog.value = true
  setTimeout(() => imageInput.value?.focus(), 50)
}

function applyImage() {
  if (imageUrl.value.trim()) {
    editor.value?.chain().focus().setImage({ src: imageUrl.value.trim() }).run()
  }
  showImageDialog.value = false
  imageUrl.value = ''
}

const wordCount = () => editor.value?.storage.characterCount.words() ?? 0
const charCount = () => editor.value?.storage.characterCount.characters() ?? 0

// Image upload from device
const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerImageUpload() {
  fileInputRef.value?.click()
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const src = e.target?.result as string
        editor.value?.chain().focus().setImage({ src }).run()
      }
      reader.readAsDataURL(file)
    }
  }
  // Reset input so the same file can be selected again
  if (fileInputRef.value) fileInputRef.value.value = ''
}
</script>

<template>
  <div class="rich-editor-wrapper">
    <!-- Toolbar -->
    <div v-if="editor && !readonly" class="editor-toolbar">
      <!-- Headings -->
      <div class="toolbar-group">
        <button
          title="Heading 1"
          :class="{ active: editor.isActive('heading', { level: 1 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        ><Heading1 :size="15" /></button>
        <button
          title="Heading 2"
          :class="{ active: editor.isActive('heading', { level: 2 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        ><Heading2 :size="15" /></button>
        <button
          title="Heading 3"
          :class="{ active: editor.isActive('heading', { level: 3 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        ><Heading3 :size="15" /></button>
      </div>

      <div class="toolbar-divider" />

      <!-- Text Formatting -->
      <div class="toolbar-group">
        <button
          title="Bold (Ctrl+B)"
          :class="{ active: editor.isActive('bold') }"
          @click="editor.chain().focus().toggleBold().run()"
        ><Bold :size="15" /></button>
        <button
          title="Italic (Ctrl+I)"
          :class="{ active: editor.isActive('italic') }"
          @click="editor.chain().focus().toggleItalic().run()"
        ><Italic :size="15" /></button>
        <button
          title="Strikethrough"
          :class="{ active: editor.isActive('strike') }"
          @click="editor.chain().focus().toggleStrike().run()"
        ><Strikethrough :size="15" /></button>
        <button
          title="Highlight"
          :class="{ active: editor.isActive('highlight') }"
          @click="editor.chain().focus().toggleHighlight().run()"
        ><Highlighter :size="15" /></button>
        <button
          title="Inline Code"
          :class="{ active: editor.isActive('code') }"
          @click="editor.chain().focus().toggleCode().run()"
        ><Code :size="15" /></button>
      </div>

      <div class="toolbar-divider" />

      <!-- Lists -->
      <div class="toolbar-group">
        <button
          title="Bullet List"
          :class="{ active: editor.isActive('bulletList') }"
          @click="editor.chain().focus().toggleBulletList().run()"
        ><List :size="15" /></button>
        <button
          title="Numbered List"
          :class="{ active: editor.isActive('orderedList') }"
          @click="editor.chain().focus().toggleOrderedList().run()"
        ><ListOrdered :size="15" /></button>
        <button
          title="Task List"
          :class="{ active: editor.isActive('taskList') }"
          @click="editor.chain().focus().toggleTaskList().run()"
        ><ListChecks :size="15" /></button>
      </div>

      <div class="toolbar-divider" />

      <!-- Blocks -->
      <div class="toolbar-group">
        <button
          title="Blockquote"
          :class="{ active: editor.isActive('blockquote') }"
          @click="editor.chain().focus().toggleBlockquote().run()"
        ><Quote :size="15" /></button>
        <button
          title="Code Block"
          :class="{ active: editor.isActive('codeBlock') }"
          @click="editor.chain().focus().toggleCodeBlock().run()"
        ><Code2 :size="15" /></button>
        <button
          title="Horizontal Rule"
          @click="editor.chain().focus().setHorizontalRule().run()"
        ><Minus :size="15" /></button>
      </div>

      <div class="toolbar-divider" />

      <!-- Media -->
      <div class="toolbar-group">
        <button
          title="Insert Link"
          :class="{ active: editor.isActive('link') }"
          @click="openLinkDialog"
        ><Link2 :size="15" /></button>
        <button title="Insert Image URL" @click="openImageDialog">
          <ImageIcon :size="15" />
        </button>
        <button title="Upload Image" @click="triggerImageUpload">
          <ImagePlus :size="15" />
        </button>
      </div>

      <div class="toolbar-divider" />

      <!-- History -->
      <div class="toolbar-group">
        <button
          title="Undo (Ctrl+Z)"
          :disabled="!editor.can().undo()"
          @click="editor.chain().focus().undo().run()"
        ><Undo :size="15" /></button>
        <button
          title="Redo (Ctrl+Y)"
          :disabled="!editor.can().redo()"
          @click="editor.chain().focus().redo().run()"
        ><Redo :size="15" /></button>
      </div>

      <!-- Word Count -->
      <div class="toolbar-count">
        {{ wordCount() }} words · {{ charCount() }} chars
      </div>
    </div>

    <!-- Editor Area -->
    <EditorContent :editor="editor" class="editor-content" :class="{ 'is-readonly': readonly }" />

    <!-- Link Dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showLinkDialog" class="editor-dialog-overlay" @click.self="showLinkDialog = false">
          <div class="editor-dialog">
            <p class="editor-dialog-title">Insert Link</p>
            <input
              ref="linkInput"
              v-model="linkUrl"
              type="url"
              placeholder="https://example.com"
              class="editor-dialog-input"
              @keyup.enter="applyLink"
              @keyup.escape="showLinkDialog = false"
            />
            <div class="editor-dialog-actions">
              <button class="editor-dialog-btn-cancel" @click="showLinkDialog = false">Cancel</button>
              <button class="editor-dialog-btn-apply" @click="applyLink">Apply</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Image Dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showImageDialog" class="editor-dialog-overlay" @click.self="showImageDialog = false">
          <div class="editor-dialog">
            <p class="editor-dialog-title">Insert Image</p>
            <p class="editor-dialog-hint">Paste a URL or paste an image directly into the editor</p>
            <input
              ref="imageInput"
              v-model="imageUrl"
              type="url"
              placeholder="https://example.com/image.png"
              class="editor-dialog-input"
              @keyup.enter="applyImage"
              @keyup.escape="showImageDialog = false"
            />
            <div class="editor-dialog-actions">
              <button class="editor-dialog-btn-cancel" @click="showImageDialog = false">Cancel</button>
              <button class="editor-dialog-btn-apply" @click="applyImage">Insert</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Hidden file input for image upload -->
    <input
      type="file"
      ref="fileInputRef"
      accept="image/*"
      style="display: none"
      @change="handleFileUpload"
      multiple
    />
  </div>
</template>

<style>
/* ── Editor Wrapper ── */
.rich-editor-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* ── Toolbar ── */
.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
  border-radius: 10px;
  background: var(--bg-elevated);
  margin-bottom: 16px;
  position: sticky;
  top: 56px;
  z-index: 10;
  opacity: 0.55;
  transition: opacity 200ms ease;
}

.editor-toolbar:hover,
.editor-toolbar:focus-within {
  opacity: 1;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 1px;
}

.toolbar-group button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: var(--text-tertiary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 120ms ease;
  font-size: 0.75rem;
}

.toolbar-group button:hover:not(:disabled),
.toolbar-group button:active:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.toolbar-group button.active {
  background: var(--accent-subtle);
  color: var(--accent);
  opacity: 1;
}

.toolbar-group button:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.toolbar-divider {
  width: 1px;
  height: 16px;
  background: var(--border-default);
  margin: 0 3px;
  opacity: 0.5;
}

.toolbar-count {
  margin-left: auto;
  font-size: 0.625rem;
  color: var(--text-disabled);
  padding-right: 4px;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

/* ── Editor Content ── */
.editor-content {
  flex: 1;
}

.editor-content .tiptap {
  min-height: 400px;
  outline: none;
  font-size: 0.9375rem;
  line-height: 1.8;
  color: var(--text-secondary);
  padding: 4px 0;
}

.editor-content .tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: var(--text-disabled);
  pointer-events: none;
  float: left;
  height: 0;
}

/* Headings */
.editor-content .tiptap h1 {
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 1.25rem 0 0.5rem;
  line-height: 1.3;
}
.editor-content .tiptap h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 1rem 0 0.4rem;
  line-height: 1.4;
}
.editor-content .tiptap h3 {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0.875rem 0 0.35rem;
}

/* Inline formatting */
.editor-content .tiptap strong { color: var(--text-primary); font-weight: 600; }
.editor-content .tiptap em { font-style: italic; }
.editor-content .tiptap s { text-decoration: line-through; opacity: 0.6; }
.editor-content .tiptap mark {
  background: rgba(251, 191, 36, 0.25);
  color: inherit;
  border-radius: 2px;
  padding: 0 2px;
}
.editor-content .tiptap code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 1px 5px;
  color: var(--accent);
}

/* Links */
.editor-content .tiptap a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.editor-content .tiptap a:hover { opacity: 0.8; }

/* Lists */
.editor-content .tiptap ul,
.editor-content .tiptap ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}
.editor-content .tiptap li { margin: 0.25rem 0; }
.editor-content .tiptap li p { margin: 0; }

/* Task List */
.editor-content .tiptap ul[data-type="taskList"] {
  list-style: none;
  padding-left: 0.25rem;
}
.editor-content .tiptap ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}
.editor-content .tiptap ul[data-type="taskList"] li label {
  cursor: pointer;
  user-select: none;
  margin-top: 3px;
}
.editor-content .tiptap ul[data-type="taskList"] li input[type="checkbox"] {
  width: 15px;
  height: 15px;
  accent-color: var(--accent);
  cursor: pointer;
  flex-shrink: 0;
}
.editor-content .tiptap ul[data-type="taskList"] li[data-checked="true"] > div {
  opacity: 0.55;
  text-decoration: line-through;
}

/* Blockquote */
.editor-content .tiptap blockquote {
  border-left: 3px solid var(--accent);
  margin: 0.75rem 0;
  padding: 0.5rem 0 0.5rem 1rem;
  color: var(--text-tertiary);
  font-style: italic;
  background: var(--accent-subtle);
  border-radius: 0 6px 6px 0;
}

/* Code Block */
.editor-content .tiptap pre {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 1rem;
  margin: 0.75rem 0;
  overflow-x: auto;
}
.editor-content .tiptap pre code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
  background: none;
  border: none;
  padding: 0;
  color: var(--text-primary);
}

/* Horizontal Rule */
.editor-content .tiptap hr {
  border: none;
  border-top: 1px solid var(--border-default);
  margin: 1.25rem 0;
}

/* Images */
.editor-content .tiptap p:has(img) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin: 0.75rem 0;
}
.editor-content .tiptap img {
  flex: 1 1 auto;
  max-width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 12px;
  margin: 0;
  display: block;
  border: 1px solid var(--border-subtle);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
}
.editor-content .tiptap img:hover {
  transform: scale(1.01);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.editor-content .tiptap p:has(img:nth-child(2)) img {
  flex: 1 1 calc(50% - 12px);
  max-height: 250px;
}
.editor-content .tiptap p:has(img:nth-child(3)) img {
  flex: 1 1 calc(33.333% - 12px);
  max-height: 180px;
}

/* ── Inline Dialog ── */
.editor-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  padding: 1rem;
}

.editor-dialog {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 14px;
  padding: 1.25rem;
  width: 100%;
  max-width: 22rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
}

.editor-dialog-title {
  font-weight: 600;
  font-size: 0.9375rem;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.editor-dialog-hint {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-bottom: 0.5rem;
  margin-top: -0.25rem;
}

.editor-dialog-input {
  width: 100%;
  border: 1px solid var(--border-default);
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 150ms;
  box-sizing: border-box;
}
.editor-dialog-input:focus { border-color: var(--accent); }
.editor-dialog-input::placeholder { color: var(--text-disabled); }

.editor-dialog-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.875rem;
  justify-content: flex-end;
}

.editor-dialog-btn-cancel {
  padding: 0.4rem 1rem;
  font-size: 0.875rem;
  border-radius: 7px;
  border: 1px solid var(--border-default);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 120ms;
}
.editor-dialog-btn-cancel:hover,
.editor-dialog-btn-cancel:active { background: var(--bg-hover); }

.editor-dialog-btn-apply {
  padding: 0.4rem 1rem;
  font-size: 0.875rem;
  border-radius: 7px;
  border: none;
  background: var(--accent);
  color: #000;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 120ms;
}
.editor-dialog-btn-apply:hover,
.editor-dialog-btn-apply:active { opacity: 0.85; }

/* ── Fade Transition ── */
.fade-enter-active, .fade-leave-active { transition: opacity 150ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
