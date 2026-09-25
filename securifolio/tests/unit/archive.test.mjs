import test from 'node:test'
import assert from 'node:assert/strict'
import loadTs from '../helpers/load-ts.cjs'
import * as geometry from '../../src/lib/spatial/parcel-geometry.mjs'
const validShape = {type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[15,-4],[15.001,-4],[15.001,-4.001],[15,-4]]]}}
const fixture = {nom:'Agent Test', numero_cadastral:'TEST-001'}
function setup() {
  const calls=[]
  const db={auth:{getUser:async()=>({data:{user:{id:'agent-test'}}})},
    from(table){const q={select:()=>q,eq:()=>q,single:async()=>table==='profiles'?{data:{role:'agent'}}:{data:null,error:{code:'PGRST116'}}};return q},
    rpc:async(name,args)=>{calls.push({name,args});return {error:null}}}
  const {saveCertificate}=loadTs('src/app/smart-archive/actions.ts',{
    '@/utils/supabase/server':{createClient:()=>db},
    '@/lib/validations':{certificateSchema:{safeParse:data=>({success:true,data})}},
    '@/lib/spatial/parcel-geometry.mjs':geometry,
  })
  process.env.CERTIFICATE_HMAC_SECRET='local-test-only-secret'
  return {saveCertificate,calls}
}
test('unknown location is saved for review without invented geometry or date',async()=>{
  const {saveCertificate,calls}=setup()
  assert.equal((await saveCertificate(fixture,undefined,null,true)).success,true)
  assert.equal(calls[0].args.p_coordonnees_spatiales,null)
  assert.equal(calls[0].args.p_date_enregistrement,null)
})
test('French numeric dates are unambiguous',async()=>{
  const {saveCertificate,calls}=setup()
  await saveCertificate({...fixture,date_etablissement:'01/02/2020'},undefined,validShape,false)
  assert.equal(calls[0]?.args.p_date_enregistrement,'2020-02-01T12:00:00.000Z')
})
test('impossible dates cannot create a title',async()=>{
  const {saveCertificate,calls}=setup()
  assert.equal((await saveCertificate({...fixture,date_etablissement:'31/02/2020'},undefined,validShape,false)).success,false)
  assert.equal(calls.length,0)
})
test('missing undeclared location and invalid polygons cannot create a title',async()=>{
  for(const shape of [null,{type:'Feature',geometry:{type:'Polygon',coordinates:[[[200,95],[201,95],[201,94],[200,95]]]},properties:{}}]){
    const {saveCertificate,calls}=setup()
    assert.equal((await saveCertificate(fixture,undefined,shape,false)).success,false)
    assert.equal(calls.length,0)
  }
})
