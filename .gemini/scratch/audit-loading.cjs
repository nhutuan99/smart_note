const fs = require('fs')
const path = require('path')

function walk(d) {
  return fs.readdirSync(d).flatMap(f => {
    const p = path.join(d, f)
    return fs.statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const files = walk('src').filter(f => f.endsWith('.vue'))
const pat = /savingPin|pinLoading|profileLoading|pushLoading|deleteLoading|forgotPinLoading|isSaving|isSubmitting|isDeleting|isLoading|isUpdating|isSending/

files.forEach(f => {
  const lines = fs.readFileSync(f, 'utf8').split('\n')
  lines.forEach((l, i) => {
    if (pat.test(l)) console.log(f + ':' + (i + 1) + ': ' + l.trim())
  })
})
