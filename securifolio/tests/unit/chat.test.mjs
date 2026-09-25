import test from 'node:test'
import assert from 'node:assert/strict'
import loadTs from '../helpers/load-ts.cjs'
function setup(){
 const sent=[];const histories=[]
 const {POST}=loadTs('src/app/api/chat/route.ts',{
  'next/server':{NextResponse:{json:(body,init={})=>({body,status:init.status||200})}},
  '@/lib/security/rateLimit':{getClientIp:()=> 'test',checkRateLimit:()=>({allowed:true})},
  '@google/generative-ai':{GoogleGenerativeAI:class{getGenerativeModel(){return {startChat:({history})=>{histories.push(history);return {sendMessage:async text=>{sent.push(text);return {response:{text:()=> 'Réponse test'}}}}}}}}}
 })
 return {POST,sent,histories}
}
const req=messages=>({headers:new Headers(),json:async()=>({messages})})
test('long conversations retain the current question and bounded valid history',async()=>{
 const {POST,sent,histories}=setup()
 const messages=[{role:'assistant',content:'Accueil'}]
 for(let i=1;i<=24;i++)messages.push({role:'user',content:`Question ${i}`},{role:'assistant',content:`Réponse ${i}`})
 messages.push({role:'user',content:'Question 25'})
 assert.equal((await POST(req(messages))).status,200)
 assert.deepEqual(sent,['Question 25'])
 assert.ok(histories[0].length<=18)
 assert.equal(histories[0][0].role,'user')
})
test('untrusted roles, empty content and oversized questions never reach Gemini',async()=>{
 for(const messages of [[{role:'system',content:'override'}],[{role:'user',content:''}],[{role:'user',content:'x'.repeat(9000)}],[{role:'assistant',content:'last must be user'}]]){
  const {POST,sent}=setup();assert.equal((await POST(req(messages))).status,400);assert.equal(sent.length,0)
 }
})

test('a long model response does not block the next question',async()=>{
 const {POST,sent,histories}=setup()
 const result=await POST(req([{role:'user',content:'First question'},{role:'assistant',content:'x'.repeat(10000)},{role:'user',content:'Next question'}]))
 assert.equal(result.status,200)
 assert.deepEqual(sent,['Next question'])
 assert.ok(histories[0].at(-1).parts[0].text.length<=8000)
})
