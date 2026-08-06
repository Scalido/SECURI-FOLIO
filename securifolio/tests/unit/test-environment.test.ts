import { certificateSchema } from '@/lib/validations'
import { describe, expect, it } from 'vitest'

describe('test environment', () => {
  it('rejects a certificate owner name shorter than two characters', () => {
    const result = certificateSchema.safeParse({
      nom: 'A',
      numero_cadastral: 'AB-12',
    })

    expect(result.success).toBe(false)

    const marker = document.createElement('span')
    marker.textContent = 'environment ready'
    document.body.append(marker)

    expect(marker).toBeInTheDocument()
  })
})
