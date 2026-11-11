const crypto = require("node:crypto");
const { createClient } = require("./shared-db");

const allowedTypes = new Set(["page_view", "resume_click", "contact_click", "social_click"]);
const rate = new Map();
const json = (statusCode, body) => ({statusCode, headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify(body)});
function valid(value,max=120) {return typeof value==="string" && value.length<=max && !/[<>\\\r\n]/.test(value);}
function safeSession(value) {return typeof value==="string" && /^[a-f0-9-]{36}$/.test(value);}
function hashSession(session) {
  return crypto.createHmac("sha256",process.env.ANALYTICS_HMAC_KEY).update(session).digest("hex");
}
async function notify(sessionHash, db) {
  if (!process.env.RESEND_API_KEY || !process.env.ANALYTICS_NOTIFY_EMAIL || !process.env.ANALYTICS_FROM_EMAIL) return;
  const events = await db("GET","portfolio_events?session_id=eq."+sessionHash+"&select=type,page,project,created_at&order=created_at.asc&limit=30");
  if (!Array.isArray(events)) return;
  const types = events.map(e=>e.type);
  const highIntent = types.includes("resume_click") || types.includes("contact_click");
  if (!highIntent) return;
  // Primary key is per session: avoids spamming on repeat actions.
  const inserted = await db("POST","portfolio_notifications?on_conflict=session_id",[{session_id:sessionHash}],{"Prefer":"resolution=ignore-duplicates,return=representation"});
  if (!Array.isArray(inserted) || !inserted.length) return;
  const journey = events.map(e=>e.type+" "+(e.project||e.page||"")).join(" → ").slice(0,1200);
  const res = await fetch("https://api.resend.com/emails",{method:"POST",headers:{"authorization":"Bearer "+process.env.RESEND_API_KEY,"content-type":"application/json"},body:JSON.stringify({
    from:process.env.ANALYTICS_FROM_EMAIL,to:[process.env.ANALYTICS_NOTIFY_EMAIL],
    subject:"Portfolio: high-interest visitor activity",
    text:"An anonymous visitor clicked your resume or contact link.\nJourney: "+journey+"\nNo visitor identity is inferred."
  })});
  if (!res.ok) console.error("Analytics notification delivery failed:",res.status);
}
exports.handler = async event => {
  if (event.httpMethod!=="POST") return json(405,{error:"Method not allowed"});
  if (!process.env.ANALYTICS_HMAC_KEY || !process.env.ANALYTICS_SUPABASE_URL || !process.env.ANALYTICS_SUPABASE_SERVICE_ROLE_KEY) return json(503,{error:"Analytics not configured"});
  const origin = event.headers.origin || "";
  if (origin && origin!==("https://"+event.headers.host)) return json(403,{error:"Forbidden"});
  if ((event.body||"").length>2500) return json(413,{error:"Too large"});
  let item;try{item=JSON.parse(event.body||"{}");}catch{return json(400,{error:"Invalid JSON"});}
  if (!safeSession(item.session) || !allowedTypes.has(item.type) || !valid(item.page) || !item.page.startsWith("/") || !valid(item.project||"",64) || !valid(item.target||"",64) || !valid(item.source||"",100)) return json(400,{error:"Invalid event"});
  if (item.type==="page_view" && item.target) return json(400,{error:"Invalid event"});
  // Best-effort per-instance burst limiter; enforce platform/WAF limits too.
  const key = hashSession(item.session),now=Date.now();
  const seen=rate.get(key)||{start:now,count:0};
  if (now-seen.start>60000){seen.start=now;seen.count=0;}
  if (++seen.count>30) return json(429,{error:"Too many events"});
  rate.set(key,seen);
  if (rate.size>1000) for(const [k,v] of rate) if(now-v.start>60000) rate.delete(k);
  try {
    const db=createClient();
    await db("POST","portfolio_events",[{session_id:key,type:item.type,page:item.page,project:item.project||null,source:item.source||"direct",target:item.target||null}],{"Prefer":"return=minimal"});
    if (item.type==="resume_click" || item.type==="contact_click") {
      try {await notify(key,db);}catch(e){console.error("Analytics notification error:",e.message);}
    }
    return json(202,{ok:true});
  }catch(e){console.error("Analytics storage error:",e.message);return json(503,{error:"Unavailable"});}
};