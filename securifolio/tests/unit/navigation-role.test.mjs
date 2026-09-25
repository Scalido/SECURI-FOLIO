import test from 'node:test'
import assert from 'node:assert/strict'
import loadTs from '../helpers/load-ts.cjs'

function roleAction(user, profile) {
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: profile, error: null }) }),
      }),
    }),
  }
  return loadTs('src/app/auth/navigation-role.ts', {
    '@/utils/supabase/server': { createClient: () => client },
  }).getCurrentNavigationRole
}

test('allowlisted authenticated account is admin even without an admin profile role', async () => {
  const previous = process.env.ADMIN_EMAILS
  process.env.ADMIN_EMAILS = 'other@example.org, Admin@Example.org '
  try {
    const getRole = roleAction({ id: 'u1', email: 'admin@example.org' }, { role: 'agent' })
    assert.equal(await getRole(), 'admin')
    assert.equal(await roleAction({ id: 'u1', email: 'admin@example.org' }, null)(), 'admin')
  } finally {
    if (previous === undefined) delete process.env.ADMIN_EMAILS
    else process.env.ADMIN_EMAILS = previous
  }
})

test('non-allowlisted account cannot acquire admin through profile or metadata', async () => {
  const previous = process.env.ADMIN_EMAILS
  process.env.ADMIN_EMAILS = 'admin@example.org'
  try {
    const user = { id: 'u2', email: 'user@example.org', user_metadata: { role: 'admin' } }
    assert.equal(await roleAction(user, { role: 'admin' })(), null)
    assert.equal(await roleAction(user, { role: 'agent' })(), 'agent')
    assert.equal(await roleAction(user, null)(), null)
  } finally {
    if (previous === undefined) delete process.env.ADMIN_EMAILS
    else process.env.ADMIN_EMAILS = previous
  }
})

test('anonymous request has no navigation role', async () => {
  assert.equal(await roleAction(null, { role: 'chef_cadastre' })(), null)
})
