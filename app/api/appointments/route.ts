import { env } from 'cloudflare:workers';
import { getCalendar,inWindow,isTime } from '@/lib/calendar';
import { sameOrigin,fail } from '@/lib/admin-access';
export async function POST(request:Request){
  if(!sameOrigin(request))return fail('Origine non autorisée.',403);
  try{
    const data=await request.json() as Record<string,unknown>;
    const name=String(data.name||'').trim().slice(0,120),email=String(data.email||'').trim().slice(0,180),reason=String(data.reason||'').trim().slice(0,120);
    const date=String(data.date||''),time=String(data.time||'');
    if(!name||!reason||!/^\S+@\S+\.\S+$/.test(email)||!inWindow(date)||!isTime(time))return fail('Vérifiez vos informations et le créneau choisi.');
    const calendar=await getCalendar(date);
    if(!calendar.slots.find(slot=>slot.time===time)?.available)return fail('Ce créneau est indisponible. Choisissez-en un autre.',409);
    await env.DB!.prepare('INSERT INTO appointments (name,email,reason,availability,scheduled_date,slot_time) VALUES (?,?,?,?,?,?)').bind(name,email,reason,`${date} à ${time}`,date,time).run();
    return Response.json({ok:true},{status:201});
  }catch{return fail('La demande n’a pas pu être enregistrée. Réessayez.',503);}
}
