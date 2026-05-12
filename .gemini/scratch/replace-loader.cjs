const fs = require('fs')
const path = require('path')

function walk(d) {
  return fs.readdirSync(d).flatMap(f => {
    const p = path.join(d, f)
    return fs.statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const files = walk('src').filter(f => f.endsWith('.vue'))

let changedFilesCount = 0

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8')
  
  if (content.includes('Loader2')) {
    // 1. Replace the component tag
    // <Loader2 v-if="loading" :size="16" class="animate-spin" />
    // Also remove `class="animate-spin"` and `class="animate-spin mr-2"`
    
    // First, let's just globally replace <Loader2 with <AppSpinner
    content = content.replace(/<Loader2/g, '<AppSpinner')
    
    // 2. Remove class="animate-spin" 
    content = content.replace(/class="([^"]*)animate-spin([^"]*)"/g, (match, before, after) => {
      const newClass = `${before}${after}`.trim().replace(/\s+/g, ' ')
      if (newClass) return `class="${newClass}"`
      return '' // if empty, remove the class attribute entirely
    })
    
    // 3. Optional: Remove Loader2 from lucide-vue-next import
    content = content.replace(/,\s*Loader2\s*}/g, ' }')
    content = content.replace(/{\s*Loader2\s*,/g, '{ ')
    content = content.replace(/{\s*Loader2\s*}/g, '{ }')
    content = content.replace(/Loader2,\s*/g, '')
    
    fs.writeFileSync(f, content, 'utf8')
    console.log(`Updated ${f}`)
    changedFilesCount++
  }
})

console.log(`Total files updated: ${changedFilesCount}`)
