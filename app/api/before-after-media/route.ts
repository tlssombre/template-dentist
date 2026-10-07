import { mediaBucket } from '@/lib/before-after';

export async function GET(request:Request){
  const key=new URL(request.url).searchParams.get('key')||'';
  if(!/^before-after\/[a-f0-9-]{36}\.(?:jpg|png|webp)$/.test(key))return new Response('Image introuvable.',{status:404});
  try{
    const object=await mediaBucket()?.get(key);
    if(!object)return new Response('Image introuvable.',{status:404});
    return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType||'image/jpeg','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
  }catch{return new Response('Image temporairement indisponible.',{status:503})}
}
