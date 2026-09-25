import test from 'node:test'
import assert from 'node:assert/strict'
import loadTs from '../helpers/load-ts.cjs'
function setup(mfaError=null){
 let privilegedCalls=0
 const normal={from:()=>({select:async()=>({data:[],error:null})}),auth:{getUser:async()=>({data:{user:{id:'admin',email:'admin@test.invalid'}},error:null})}}
 const users=Array.from({length:101},(_,i)=>({id:String(i),email:`user${i}@test.invalid`,created_at:'2020-01-01'}))
 const q={select:()=>q,order:()=>q,range:async(from,to)=>({data:users.slice(from,to+1).map(u=>({id:u.id,role:'agent'})),error:null})}
 const privileged={auth:{admin:{listUsers:async({page=1,perPage=50}={})=>({data:{users:users.slice((page-1)*perPage,page*perPage)},error:null})}},from:()=>q}
 process.env.ADMIN_EMAILS='admin@test.invalid'
 const api=loadTs('src/app/admin/actions.ts',{'@/utils/supabase/server':{createClient:()=>normal},'@/utils/supabase/admin':{createAdminClient:()=>{privilegedCalls++;return privileged}},'next/cache':{revalidatePath:()=>{}},'@/lib/security/mfa':{requireMfaForSensitiveRole:async()=>mfaError}})
 return {api,getCalls:()=>privilegedCalls}
}
test('admin table reads cannot use the privileged client without MFA',async()=>{
 const {api,getCalls}=setup('MFA requise')
 const result=await api.getProfilesData()
 assert.ok(result.error);assert.equal(getCalls(),0)
})
test('admin user listing joins roles across multiple pages',async()=>{
 const {api}=setup()
 const result=await api.getProfilesData()
 assert.equal(result.data?.length,101)
 assert.equal(result.data?.at(-1).role,'agent')
})
