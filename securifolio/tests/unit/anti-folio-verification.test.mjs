import test from 'node:test'
import assert from 'node:assert/strict'
import loadTs from '../helpers/load-ts.cjs'

const { classifyTitleResults, selectedCirconscription } = loadTs('src/app/anti-folio/verification.ts')
const { roleDestination, roleLabel } = loadTs('src/lib/navigation/role.ts')

test('missing and failed searches never report fraud', () => {
  assert.equal(classifyTitleResults([]), 'missing')
  assert.equal(classifyTitleResults(null), 'error')
})

test('only the recorded title status determines a single match', () => {
  for (const [statut, expected] of [
    ['Valide', 'valid'],
    ['Litige', 'disputed'],
    ['Falsifié', 'falsified'],
    ['En attente de validation cadastrale', 'pending'],
    ['Validé techniquement', 'pending'],
    ['Autre statut', 'unknown'],
  ]) {
    assert.equal(classifyTitleResults([{ statut }]), expected)
  }
})

test('multiple matching records require review, not an inferred spatial conflict', () => {
  assert.equal(classifyTitleResults([{ statut: 'Valide' }, { statut: 'Valide' }]), 'multiple')
})

test('circonscription selection accepts only known database values', () => {
  assert.equal(selectedCirconscription('Gombe'), 'Gombe')
  assert.equal(selectedCirconscription('Ngaliema'), 'Ngaliema')
  assert.equal(selectedCirconscription('all'), null)
  assert.equal(selectedCirconscription('fake'), null)
})

test('missing profile never grants a privileged destination or label', () => {
  assert.equal(roleDestination(null), '/smart-archive')
  assert.equal(roleLabel(null), 'Profil indisponible')
  assert.equal(roleDestination('agent'), '/smart-archive')
})

test('explicit sensitive roles receive their correct destination', () => {
  assert.equal(roleDestination('admin'), '/admin')
  assert.equal(roleDestination('superviseur'), '/admin')
  assert.equal(roleDestination('chef_cadastre'), '/cadastre-dashboard')
  assert.equal(roleDestination('conservateur'), '/conservateur-dashboard')
})
