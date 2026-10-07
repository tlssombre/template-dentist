import { env } from 'cloudflare:workers';
export async function POST(request:Request){
  const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Origine non autorisée.'},{status:403});
  try{
    const data=await request.json() as Record<string,unknown>;
    const name=String(data.name||'').trim().slice(0,120),email=String(data.email||'').trim().slice(0,180),reason=String(data.reason||'').trim().slice(0,120),availability=String(data.availability||'').trim().slice(0,250);
    if(!name||!reason||!/^\S+@\S+\.\S+$/.test(email))return Response.json({error:'Vérifiez le nom, l’e-mail et le motif.'},{status:400});
    await env.DB!.prepare('INSERT INTO appointments (name,email,reason,availability) VALUES (?,?,?,?)').bind(name,email,reason,availability).run();
    return Response.json({ok:true},{status:201});
  }catch{return Response.json({error:'La demande n’a pas pu être enregistrée. Réessayez.'},{status:503});}
}
