const crypto=require("node:crypto");
const {createClient}=require("./shared-db");
const respond=(statusCode,body)=>({statusCode,headers:{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"},body:JSON.stringify(body)});
exports.handler=async event=>{
 if(event.httpMethod!=="GET") return respond(405,{error:"Method not allowed"});
 const expected=process.env.ANALYTICS_ADMIN_TOKEN;
 if(!expected||expected.length<32) return respond(503,{error:"Admin not configured"});
 const auth=(event.headers.authorization||"").replace(/^Bearer /,"");
 const a=Buffer.from(auth),b=Buffer.from(expected);
 if(a.length!==b.length||!crypto.timingSafeEqual(a,b)) return respond(401,{error:"Unauthorized"});
 try{
  const db=createClient();
  const events=await db("GET","portfolio_events?select=session_id,type,page,project,source,target,created_at&order=created_at.desc&limit=1000");
  const sessions=new Map();
  for(const e of events) {
   const id=e.session_id.slice(0,12);
   if(!sessions.has(id)) sessions.set(id,{id,source:e.source,last:e.created_at,events:[]});
   sessions.get(id).events.push({type:e.type,page:e.page,project:e.project,created_at:e.created_at});
  }
  const cutoff=Date.now()-24*3600*1000;
  return respond(200,{last24h:events.filter(e=>new Date(e.created_at).getTime()>cutoff).length,
   sessions:new Set(events.filter(e=>new Date(e.created_at).getTime()>cutoff).map(e=>e.session_id)).size,
   resumeClicks:events.filter(e=>e.type==="resume_click").length,
   contactClicks:events.filter(e=>e.type==="contact_click").length,
   journeys:[...sessions.values()].slice(0,100)});
 }catch(e){console.error("Analytics admin query failed:",e.message);return respond(503,{error:"Analytics unavailable"});}
};