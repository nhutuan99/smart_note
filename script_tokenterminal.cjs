const fs = require('fs')

async function run() {
  const html = await fetch('https://tokenterminal.com').then(r => r.text())
  const cssLinks = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"[^>]*>/gi)]
  console.log('Found CSS files:', cssLinks.length)
  const cssArr = await Promise.all(cssLinks.map(l => fetch(new URL(l[1], 'https://tokenterminal.com')).then(r => r.text())))
  const css = cssArr.join('\n')
  const rootMatches = css.match(/:root\s*{([^}]+)}/g)
  const vars = css.match(/--[a-zA-Z0-9-]+:\s*#?[a-zA-Z0-9\(\),%.\s]+;/g)
  if (rootMatches) {
    console.log(rootMatches.join('\n').slice(0, 1000))
  } else if (vars) {
    console.log(vars.slice(0, 50).join('\n'))
  } else {
    // try finding tailwind classes
    const classes = Array.from(new Set(html.match(/bg-[a-zA-Z0-9-\[\]#]+/g)))
    console.log('Classes:', classes.slice(0, 50))
  }
}

run()
