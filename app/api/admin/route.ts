import { env } from 'cloudflare:workers';
import { DEFAULT_HOURS,getCalendar,inWindow,isTime,minutes } from '@/lib/calendar';
import { can,fail,getRole,person,sameOrigin } from '@/lib/admin-access';
const roles=['manager','reception','content'];
const text=(value:unknown,max:number)=>String(value??'').trim().slice(0,max);
export async function GET(request:Request){
  try{
    const who=person(request);if(!who.id)return fail('Connexion requise.',401);
    const claimed=await env.DB!.prepare('SELECT user_id FROM admin_owners WHERE id=1').first<{user_id:string}>();
    if(!claimed)return Response.json({setup:true});
    const role=await getRole(request);if(!role)return fail('Accès réservé au personnel autorisé.',403);
    const [appointments,team,settings,hours,blocks,employees]=await Promise.all([
      can(role,'appointments')?env.DB!.prepare('SELECT id,name,email,reason,availability,scheduled_date AS scheduledDate,slot_time AS slotTime,status,created_at AS createdAt FROM appointments ORDER BY id DESC LIMIT 300').all():Promise.resolve({results:[]}),
      can(role,'content')?env.DB!.prepare('SELECT id,name,role,bio,sort_order AS sortOrder FROM team ORDER BY sort_order,id').all():Promise.resolve({results:[]}),
      can(role,'content')?env.DB!.prepare('SELECT key,value FROM settings').all():Promise.resolve({results:[]}),
      can(role,'calendar')?env.DB!.prepare('SELECT weekday,is_open AS isOpen,start_time AS startTime,end_time AS endTime FROM weekly_hours').all():Promise.resolve({results:[]}),
      can(role,'calendar')?env.DB!.prepare("SELECT id,date,time,note FROM calendar_blocks WHERE date>=date('now') ORDER BY date,time LIMIT 300").all():Promise.resolve({results:[]}),
      can(role,'employees')?env.DB!.prepare('SELECT id,name,email,role,active FROM staff_accounts ORDER BY id DESC').all():Promise.resolve({results:[]}),
    ]);
    return Response.json({setup:false,role,appointments:appointments.results,team:team.results,settings:Object.fromEntries((settings.results as {key:string;value:string}[]).map(x=>[x.key,x.value])),hours:DEFAULT_HOURS.map(d=>(hours.results as {weekday:number}[]).find(x=>x.weekday===d.weekday)??d),blocks:blocks.results,employees:employees.results},{headers:{'Cache-Control':'no-store'}});
  }catch{return fail('Données temporairement indisponibles.',503)}
}
export async function POST(request:Request){
  if(!sameOrigin(request))return fail('Origine non autorisée.',403);
  try{
    const who=person(request);if(!who.id)return fail('Connexion requise.',401);
    const data=await request.json() as Record<string,unknown>;
    if(data.action==='bootstrap'){
      const claimed=await env.DB!.prepare('SELECT user_id FROM admin_owners WHERE id=1').first<{user_id:string}>();
      if(claimed)return fail('Administration déjà activée.',409);
      await env.DB!.prepare('INSERT OR IGNORE INTO admin_owners (id,user_id,email) VALUES (1,?,?)').bind(who.id,who.email).run();
      return (await getRole(request))==='owner'?Response.json({ok:true}):fail('Administration déjà activée.',409);
    }
    const role=await getRole(request), action=String(data.action||'');
    const task=action==='status'?'appointments':action.startsWith('block-')||action==='hours'?'calendar':action.startsWith('team-')||action==='settings'?'content':'employees';
    if(!can(role,task))return fail('Vous n’avez pas les droits pour cette action.',403);
    const id=Number(data.id);
    if(action==='status'){
      const status=String(data.status||'');if(!Number.isInteger(id)||id<1||!['new','confirmed','completed','cancelled'].includes(status))return fail('Statut invalide.');
      const existing=await env.DB!.prepare('SELECT status,scheduled_date AS date,slot_time AS time FROM appointments WHERE id=?').bind(id).first<{status:string;date:string|null;time:string|null}>();
      if(!existing)return fail('Demande introuvable.',404);
      if(status==='completed'&&existing.status!=='confirmed'&&existing.status!=='completed')return fail('Acceptez le rendez-vous avant de le terminer.',409);
      if(status==='confirmed'&&existing.status!=='confirmed'){
        if(!existing.date||!existing.time||!inWindow(existing.date))return fail('Cette demande n’a pas de créneau valide. Faites une nouvelle demande.',409);
        const calendar=await getCalendar(existing.date);
        if(!calendar.slots.find(slot=>slot.time===existing.time)?.available)return fail('Créneau désormais occupé. Choisissez une autre date pour cette demande.',409);
      }
      const updated=await env.DB!.prepare("UPDATE appointments SET status=? WHERE id=? AND ( ? NOT IN ('confirmed','completed') OR NOT EXISTS (SELECT 1 FROM calendar_blocks WHERE date=appointments.scheduled_date AND time=appointments.slot_time))").bind(status,id,status).run();
      if(!updated.meta.changes)return fail('Ce créneau vient d’être bloqué.',409);
    }else if(action==='block-add'){
      const date=text(data.date,10),time=text(data.time,5),note=text(data.note,120);
      if(!inWindow(date)||!isTime(time))return fail('Date ou heure invalide.');
      const confirmed=await env.DB!.prepare("SELECT id FROM appointments WHERE scheduled_date=? AND slot_time=? AND status IN ('confirmed','completed')").bind(date,time).first();
      if(confirmed)return fail('Un rendez-vous accepté occupe déjà ce créneau.',409);
      const inserted=await env.DB!.prepare("INSERT INTO calendar_blocks (date,time,note) SELECT ?,?,? WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE scheduled_date=? AND slot_time=? AND status IN ('confirmed','completed'))").bind(date,time,note,date,time).run();
      if(!inserted.meta.changes)return fail('Un rendez-vous accepté occupe déjà ce créneau.',409);
    }else if(action==='block-delete'){
      if(!Number.isInteger(id)||id<1)return fail('Période invalide.');
      await env.DB!.prepare('DELETE FROM calendar_blocks WHERE id=?').bind(id).run();
    }else if(action==='hours'){
      const rows=Array.isArray(data.hours)?data.hours as Record<string,unknown>[]:[];
      if(rows.length!==7)return fail('Renseignez les sept jours de la semaine.');
      const statements=[];
      for(let day=0;day<7;day++){
        const row=rows.find(r=>Number(r.weekday)===day),start=text(row?.startTime,5),end=text(row?.endTime,5),open=row?.isOpen?1:0;
        if(!row||!/^\d{2}:(00|30)$/.test(start)||!/^\d{2}:(00|30)$/.test(end)||minutes(start)<8*60||minutes(end)>20*60||minutes(end)<=minutes(start))return fail('Vérifiez les horaires : de 08:00 à 20:00, par pas de 30 minutes.');
        statements.push(env.DB!.prepare('INSERT INTO weekly_hours (weekday,is_open,start_time,end_time) VALUES (?,?,?,?) ON CONFLICT(weekday) DO UPDATE SET is_open=excluded.is_open,start_time=excluded.start_time,end_time=excluded.end_time').bind(day,open,start,end));
      }
      await env.DB!.batch(statements);
    }else if(action==='team-save'){
      const name=text(data.name,100),roleName=text(data.role,100),bio=text(data.bio,500);if(!name||!roleName)return fail('Nom et fonction requis.');
      if(Number.isInteger(id)&&id>0)await env.DB!.prepare('UPDATE team SET name=?,role=?,bio=? WHERE id=?').bind(name,roleName,bio,id).run();
      else await env.DB!.prepare('INSERT INTO team (name,role,bio,sort_order) VALUES (?,?,?,(SELECT COALESCE(MAX(sort_order),0)+1 FROM team))').bind(name,roleName,bio).run();
    }else if(action==='team-delete'){
      if(!Number.isInteger(id)||id<1)return fail('Membre invalide.');await env.DB!.prepare('DELETE FROM team WHERE id=?').bind(id).run();
    }else if(action==='settings'){
      const statements=['cabinetName','tagline','phone','email','address','hours'].map(key=>env.DB!.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,text(data[key],300)));await env.DB!.batch(statements);
    }else if(action==='employee-save'){
      const name=text(data.name,100),email=text(data.email,180).toLowerCase(),staffRole=text(data.role,30),active=data.active===false?0:1;
      if(!name||!/^\S+@\S+\.\S+$/.test(email)||!roles.includes(staffRole))return fail('Nom, e-mail et fonction valides requis.');
      if(Number.isInteger(id)&&id>0)await env.DB!.prepare('UPDATE staff_accounts SET name=?,email=?,role=?,active=? WHERE id=?').bind(name,email,staffRole,active,id).run();
      else await env.DB!.prepare('INSERT INTO staff_accounts (name,email,role,active) VALUES (?,?,?,?)').bind(name,email,staffRole,active).run();
    }else if(action==='employee-delete'){
      if(!Number.isInteger(id)||id<1)return fail('Employé invalide.');await env.DB!.prepare('DELETE FROM staff_accounts WHERE id=?').bind(id).run();
    }else return fail('Action inconnue.');
    return Response.json({ok:true});
  }catch(error){
    if(String(error).includes('UNIQUE constraint'))return fail('Cette adresse ou ce créneau existe déjà.',409);
    return fail('Enregistrement impossible. Réessayez.',503);
  }
}
