export function autoFormatJsonContent(htmlOrText: string): string | null {
  const isHtml = htmlOrText.includes('<') && htmlOrText.includes('>')
  let textContent = htmlOrText
  
  if (isHtml) {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlOrText.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n</p>')
    textContent = tempDiv.textContent || ''
  }

  const lines = textContent.trim().split('\n')
  
  // Try single JSON object/array first
  try {
    const parsed = JSON.parse(textContent.trim())
    if (typeof parsed === 'object' && parsed !== null) {
      const formatted = JSON.stringify(parsed, null, 2)
      const escaped = formatted.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return `<pre><code class="language-json">${escaped}</code></pre>`
    }
  } catch {
    // Continue to check for line-by-line JSON (NDJSON/SSE)
  }

  let validJsonLines = 0
  let formattedLines: string[] = []
  const nonEmptyLines = lines.filter(l => l.trim().length > 0)

  if (nonEmptyLines.length === 0) return null

  for (let line of lines) {
    let cleanLine = line.trim()
    if (!cleanLine) {
      formattedLines.push('')
      continue
    }
    
    let prefix = ''
    // Handle SSE pattern "data: {...}"
    if (cleanLine.startsWith('data: ')) {
      prefix = 'data: '
      cleanLine = cleanLine.substring(6).trim()
    }
    
    if ((cleanLine.startsWith('{') && cleanLine.endsWith('}')) || (cleanLine.startsWith('[') && cleanLine.endsWith(']'))) {
      try {
        const parsed = JSON.parse(cleanLine)
        const formatted = JSON.stringify(parsed, null, 2)
        validJsonLines++
        
        if (prefix) {
          formattedLines.push(prefix + formatted)
        } else {
          formattedLines.push(formatted)
        }
      } catch {
        formattedLines.push(line)
      }
    } else {
      formattedLines.push(line)
    }
  }

  // If at least one valid JSON line was found and represents a significant portion of non-empty lines
  if (validJsonLines > 0 && validJsonLines >= nonEmptyLines.length * 0.3) {
    const escaped = formattedLines.join('\n\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<pre><code class="language-json">${escaped}</code></pre>`
  }

  return null
}
