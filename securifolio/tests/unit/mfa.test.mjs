import test from 'node:test'
import assert from 'node:assert/strict'
import loadTs from '../helpers/load-ts.cjs'
const {requireMfaForSensitiveRole}=loadTs('src/lib/security/mfa.ts')
test('sensitive roles require MFA even on a local development server',async()=>{
 const previous=process.env.NODE_ENV;process.env.NODE_ENV='development'
 try {for(const role of ['admin','chef_cadastre','conservateur']){
  assert.match(await requireMfaForSensitiveRole({auth:{mfa:{getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:'aal1'},error:null})}}},role),/MFA/)
  assert.equal(await requireMfaForSensitiveRole({auth:{mfa:{getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:'aal2'},error:null})}}},role),null)
 }}finally{process.env.NODE_ENV=previous}
})
