const {createClient}=require("./shared-db");
exports.config={schedule:"0 4 * * *"};
exports.handler=async ()=>{
 if(!process.env.ANALYTICS_SUPABASE_URL || !process.env.ANALYTICS_SUPABASE_SERVICE_ROLE_KEY) return {statusCode:503};
 try{
  const cutoff=new Date(Date.now()-30*24*60*60*1000).toISOString();
  const db=createClient();
  await db("DELETE","portfolio_events?created_at=lt."+encodeURIComponent(cutoff));
  await db("DELETE","portfolio_notifications?created_at=lt."+encodeURIComponent(cutoff));
  return {statusCode:200};
 }catch(e){console.error("Analytics cleanup error:",e.message);return {statusCode:500};}
};