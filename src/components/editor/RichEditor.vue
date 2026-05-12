<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import CustomImageNode from './CustomImageNode.vue'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Typography from '@tiptap/extension-typography'
import Highlight from '@tiptap/extension-highlight'
import { createLowlight, common } from 'lowlight'
import { watch, onBeforeUnmount, ref, onMounted, onUnmounted, computed } from 'vue'
import {
  Bold, Italic, Strikethrough, Code, Link2, Image as ImageIcon,
  List, ListOrdered, ListChecks, Quote, Minus, Undo, Redo,
  Heading1, Heading2, Heading3, Highlighter, Code2, ImagePlus, X, ChevronLeft, ChevronRight
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

const CustomImage = Image.extend({
  inline: true,
  group: 'inline',
  addNodeView() {
    return VueNodeViewRenderer(CustomImageNode)
  }
})

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
    CustomImage.configure({ allowBase64: true }),
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
      
      const imageFiles: File[] = []
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) imageFiles.push(file)
        }
      }

      if (imageFiles.length > 0) {
        Promise.all(imageFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(file)
          })
        })).then(sources => {
          if (editor.value) {
            const htmlString = sources.map(src => `<img src="${src}" />`).join('')
            editor.value.commands.insertContent(htmlString)
          }
        })
        return true
      }
      return false
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

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
  if (imageFiles.length > 0) {
    const sources = await Promise.all(imageFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })
    }))
    
    if (editor.value) {
      const htmlString = sources.map(src => `<img src="${src}" />`).join('')
      editor.value.commands.insertContent(htmlString)
    }
  }

  // Reset input so the same file can be selected again
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// Image Zoom
const zoomedImageIndex = ref<number | null>(null)
const allImages = ref<string[]>([])
const zoomedImage = computed(() => {
  if (zoomedImageIndex.value !== null && allImages.value.length > 0) {
    return allImages.value[zoomedImageIndex.value]
  }
  return null
})

function handleEditorClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.tagName === 'IMG') {
    const src = (target as HTMLImageElement).src
    const container = target.closest('.editor-content')
    if (container) {
      const imgs = Array.from(container.querySelectorAll('img'))
      const uniqueSrcs = Array.from(new Set(imgs.map(img => img.src)))
      allImages.value = uniqueSrcs
      const idx = allImages.value.indexOf(src)
      zoomedImageIndex.value = idx !== -1 ? idx : 0
    } else {
      allImages.value = [src]
      zoomedImageIndex.value = 0
    }
  }
}

function closeZoom() {
  zoomedImageIndex.value = null
  allImages.value = []
}

function prevImage() {
  if (zoomedImageIndex.value !== null && zoomedImageIndex.value > 0) {
    zoomedImageIndex.value--
  }
}

function nextImage() {
  if (zoomedImageIndex.value !== null && zoomedImageIndex.value < allImages.value.length - 1) {
    zoomedImageIndex.value++
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (zoomedImageIndex.value !== null) {
    if (e.key === 'Escape') closeZoom()
    else if (e.key === 'ArrowLeft') prevImage()
    else if (e.key === 'ArrowRight') nextImage()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
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
    <div class="editor-content" @click="handleEditorClick">
      <EditorContent :editor="editor" :class="{ 'is-readonly': readonly }" />
    </div>

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

    <!-- Zoom Overlay -->
    <Teleport to="body">
      <Transition name="fade-zoom">
        <div v-if="zoomedImage" class="image-zoom-overlay" @click="closeZoom">
          <div class="zoom-counter" v-if="allImages.length > 1" @click.stop>
            {{ zoomedImageIndex! + 1 }} / {{ allImages.length }}
          </div>
          <button 
            v-if="allImages.length > 1 && zoomedImageIndex! > 0" 
            class="zoom-nav-btn zoom-prev-btn" 
            @click.stop="prevImage"
          >
            <ChevronLeft :size="32" />
          </button>
          <img :src="zoomedImage" class="zoomed-img" @click.stop />
          <button 
            v-if="allImages.length > 1 && zoomedImageIndex! < allImages.length - 1" 
            class="zoom-nav-btn zoom-next-btn" 
            @click.stop="nextImage"
          >
            <ChevronRight :size="32" />
          </button>
          <button class="zoom-close-btn" @click="closeZoom">
            <X :size="24" />
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style>
/* ── Editor Wrapper ── */
.rich-editor-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* ── Image Zoom ── */
.image-zoom-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  cursor: zoom-out;
}
.zoomed-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  cursor: default;
}
.zoom-close-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}
.zoom-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
.zoom-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  z-index: 10000;
}
.zoom-nav-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: translateY(-50%) scale(1.1);
}
.zoom-prev-btn {
  left: 2rem;
}
.zoom-next-btn {
  right: 2rem;
}
.zoom-counter {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  pointer-events: none;
}
.fade-zoom-enter-active,
.fade-zoom-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-zoom-enter-from,
.fade-zoom-leave-to {
  opacity: 0;
  transform: scale(0.98);
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

/* Images Grid Layout */
.editor-content .tiptap p:has(> .custom-image-wrapper) {
  display: grid;
  gap: 12px;
  align-items: start;
  margin: 0.75rem 0;
}
/* 1 image */
.editor-content .tiptap p:has(> .custom-image-wrapper:nth-child(1):last-child) {
  grid-template-columns: 1fr;
}
/* 2 images */
.editor-content .tiptap p:has(> .custom-image-wrapper:nth-child(2):last-child) {
  grid-template-columns: 1fr 1fr;
}
/* 3 images */
.editor-content .tiptap p:has(> .custom-image-wrapper:nth-child(3):last-child) {
  grid-template-columns: 1fr 1fr 1fr;
}
/* 4 images */
.editor-content .tiptap p:has(> .custom-image-wrapper:nth-child(4):last-child) {
  grid-template-columns: 1fr 1fr;
}
/* 5+ images */
.editor-content .tiptap p:has(> .custom-image-wrapper:nth-child(5)) {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.editor-content .tiptap p:has(> .custom-image-wrapper) > .custom-image-wrapper {
  margin: 0;
  max-width: none;
  flex: none;
  width: 100%;
}
.editor-content .tiptap p:has(> .custom-image-wrapper) > .custom-image-wrapper img {
  width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: contain;
  margin: 0;
  border-radius: 8px;
  background-color: var(--bg-surface);
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
