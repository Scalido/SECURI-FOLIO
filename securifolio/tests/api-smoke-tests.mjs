import assert from 'node:assert/strict'

const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3100'

async function post(path, body, headers = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

const analyze = await post('/api/analyze-document', {})
assert.equal(analyze.status, 401, 'analyze-document must reject unauthenticated requests before processing input')

const chat = await post('/api/chat', { messages: [] })
assert.equal(chat.status, 400, 'chat must reject an empty message history')

const dueDiligence = await post('/api/due-diligence', { numeroCadastral: '' })
assert.equal(dueDiligence.status, 400, 'due-diligence must reject an empty cadastral number')

console.log('API smoke tests passed')
