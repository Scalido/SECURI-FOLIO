import test from 'node:test'
import assert from 'node:assert/strict'
import loadTs from '../helpers/load-ts.cjs'
import * as geometry from '../../src/lib/spatial/parcel-geometry.mjs'
test('technical approval refuses an unlocated parcel but permits recording a dispute',async()=>{
 let writes=0
 const db={auth:{getUser:async()=>({data:{user:{id:'chief'}}})},from(table){const q={select:()=>q,eq:()=>q,single:async()=>({data:table==='profiles'?{role:'chef_cadastre'}:{coordonnees_spatiales:null}})};return q},rpc:async()=>{writes++;return {error:null}}}
 const {updateTitleStatus}=loadTs('src/app/cadastre-dashboard/actions.ts',{'@/utils/supabase/server':{createClient:()=>db},'@/lib/security/mfa':{requireMfaForSensitiveRole:async()=>null},'@/lib/spatial/parcel-geometry.mjs':geometry})
 assert.equal((await updateTitleStatus('title','Validé techniquement')).success,false)
 assert.equal(writes,0)
 assert.equal((await updateTitleStatus('title','Litige')).success,true)
 assert.equal(writes,1)
})
