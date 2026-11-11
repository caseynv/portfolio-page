exports.createClient = () => {
  const base = process.env.ANALYTICS_SUPABASE_URL;
  const key = process.env.ANALYTICS_SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw Error("Missing analytics credentials");
  return async (method,path,body,headers={}) => {
    const response = await fetch(base.replace(/\\/$/,"")+"/rest/v1/"+path,{
      method,headers:{"apikey":key,"authorization":"Bearer "+key,"content-type":"application/json",...headers},
      ...(body===undefined?{}:{body:JSON.stringify(body)})
    });
    if(!response.ok) throw Error("Database request failed: "+response.status);
    const content=await response.text();
    return content?JSON.parse(content):null;
  };
};