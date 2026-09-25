import test from 'node:test'
import assert from 'node:assert/strict'
import loadTs from '../helpers/load-ts.cjs'
const response={json:(body,init={})=>({status:init.status||200,body})}
const headers=new Headers()
const rate={getClientIp:()=> 'test',checkRateLimit:()=>({allowed:true})}
const request=body=>({headers,json:async()=>body})
function due(result,missingConfig=false){
 const q={select:()=>q,eq:()=>q,limit:()=>q,maybeSingle:async()=>result}
 return loadTs('src/app/api/due-diligence/route.ts',{'next/server':{NextResponse:response},'@/lib/security/rateLimit':rate,'@/utils/supabase/admin':{createAdminClient:()=>{if(missingConfig)throw Error('missing');return {from:()=>q}}}}).POST
}
test('database failure and missing server configuration are not missing titles or invalid user input',async()=>{
 assert.equal((await due({data:null,error:{code:'08006'}})(request({numeroCadastral:'TEST-001'}))).status,503)
 assert.equal((await due(null,true)(request({numeroCadastral:'TEST-001'}))).status,503)
 assert.equal((await due({data:null,error:null})(request({numeroCadastral:'TEST-001'}))).status,404)
})
test('OCR refuses external and unsigned image URLs before downloading',async()=>{
 process.env.GEMINI_API_KEY='test';process.env.NEXT_PUBLIC_SUPABASE_URL='https://project.supabase.co'
 let downloads=0
 const previous=globalThis.fetch
 globalThis.fetch=async()=>{downloads++;return new Response(new Uint8Array([137,80,78,71,13,10,26,10]),{headers:{'content-type':'image/png'}})}
 const post=loadTs('src/app/api/analyze-document/route.ts',{
  'next/server':{NextResponse:response},'@/lib/security/rateLimit':rate,
  '@/utils/supabase/server':{createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'test'}}})}})},
  '@google/generative-ai':{SchemaType:{OBJECT:'object',STRING:'string',BOOLEAN:'boolean'},GoogleGenerativeAI:class{getGenerativeModel(){return {generateContent:async()=>({response:{text:()=>'{"nom":"Test"}'}})}}}}
 }).POST
 try{for(const imageUrl of ['https://example.org/private','https://project.supabase.co/storage/v1/object/public/scans_certificats/test.png'])assert.equal((await post(request({imageUrl,mimeType:'image/png'}))).status,400);assert.equal(downloads,0)}finally{globalThis.fetch=previous}
})

test('OCR signed downloads reject oversized streams and disable redirects',async()=>{
 process.env.GEMINI_API_KEY='test';process.env.NEXT_PUBLIC_SUPABASE_URL='https://project.supabase.co'
 let generated=0, cancelled=false, providerCalls=0
 const previous=globalThis.fetch
 globalThis.fetch=async(_url,options)=>{
  assert.equal(options.redirect,'error');assert.ok(options.signal)
  return new Response(new ReadableStream({pull(controller){generated++;controller.enqueue(new Uint8Array(1024*1024))},cancel(){cancelled=true}}),{headers:{'content-type':'image/png'}})
 }
 const post=loadTs('src/app/api/analyze-document/route.ts',{
  'next/server':{NextResponse:response},'@/lib/security/rateLimit':rate,
  '@/utils/supabase/server':{createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'test'}}})}})},
  '@google/generative-ai':{SchemaType:{OBJECT:'object',STRING:'string',BOOLEAN:'boolean'},GoogleGenerativeAI:class{getGenerativeModel(){providerCalls++;throw Error('must not call')}}}
 }).POST
 try {
  const result=await post(request({imageUrl:'https://project.supabase.co/storage/v1/object/sign/scans_certificats/temp.png?token=test',mimeType:'image/png'}))
  assert.equal(result.status,413);assert.equal(cancelled,true);assert.ok(generated<=10);assert.equal(providerCalls,0)
 }finally{globalThis.fetch=previous}
})

test('OCR accepts supported documents and reports registry unavailability without fabricating absence',async()=>{
 process.env.GEMINI_API_KEY='test';process.env.NEXT_PUBLIC_SUPABASE_URL='https://project.supabase.co'
 const previous=globalThis.fetch
 globalThis.fetch=async()=>new Response(new Uint8Array([137,80,78,71,13,10,26,10]),{headers:{'content-type':'image/png'}})
 const database={auth:{getUser:async()=>({data:{user:{id:'test'}}})},from(){return {select(){return {eq:async()=>({data:null,error:{code:'08006'}})}}}}}
 const post=loadTs('src/app/api/analyze-document/route.ts',{
  'next/server':{NextResponse:response},'@/lib/security/rateLimit':rate,
  '@/utils/supabase/server':{createClient:()=>database},
  '@google/generative-ai':{SchemaType:{OBJECT:'object',STRING:'string',BOOLEAN:'boolean'},GoogleGenerativeAI:class{getGenerativeModel(){return {generateContent:async()=>({response:{text:()=>'{"nom":"Test","numero_cadastral":"TEST-001"}'}})}}}}
 }).POST
 try {for(const payload of [{mimeType:'image/png',base64Data:'iVBORw0KGgo='},{mimeType:'image/png',imageUrl:'https://project.supabase.co/storage/v1/object/sign/scans_certificats/temp.png?token=test'}]){
  const result=await post(request(payload));assert.equal(result.status,200);assert.equal(result.body.data.numero_cadastral,'TEST-001');assert.equal(result.body.dbVerification.available,false)
 }}finally{globalThis.fetch=previous}
})
