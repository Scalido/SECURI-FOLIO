import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const pageSource = readFileSync(
  join(process.cwd(), 'src', 'app', 'smart-archive', 'page.tsx'),
  'utf8',
)

describe('plein écran de la carte Smart-Archive', () => {
  it('rend l’espace de traçage hors des conteneurs filtrés via document.body', () => {
    expect(pageSource).toContain("import { createPortal } from 'react-dom'")
    expect(pageSource).toMatch(/isMapFullscreen\s*&&\s*createPortal\(/)
    expect(pageSource).toMatch(/document\.body/)
  })
})
