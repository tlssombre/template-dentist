import { env } from 'cloudflare:workers';

function identity(request: Request){return {id:request.headers.get('oai-authenticated-user-id'),email:request.headers.get('oai-authenticated-user-email')};}
function error(message:string,status=400){return Response.json({error:message},{status});}
function sameOrigin(request:Request){const origin=request.headers.get('origin');return !origin || origin===new URL(request.url).origin;}
async function owner(request:Request){const who=identity(request);if(!who.id)return false;const row=await env.DB!.prepare('SELECT user_id FROM admin_owners WHERE id = 1').first<{user_id:string}>();return row?.user_id===who.id;}
export async function GET(request:Request){
  try{
    const who=identity(request);if(!who.id)return error('Connexion requise.',401);
    const claimed=await env.DB!.prepare('SELECT user_id FROM admin_owners WHERE id = 1').first<{user_id:string}>();
    if(!claimed)return Response.json({setup:true});
    if(claimed.user_id!==who.id)return error('Accès réservé à l’administration.',403);
    const [appointments,team,settings]=await Promise.all([
      env.DB!.prepare('SELECT id,name,email,reason,availability,status,created_at AS createdAt FROM appointments ORDER BY id DESC LIMIT 300').all(),
      env.DB!.prepare('SELECT id,name,role,bio,sort_order AS sortOrder FROM team ORDER BY sort_order,id').all(),
      env.DB!.prepare('SELECT key,value FROM settings').all(),
    ]);
    return Response.json({setup:false,appointments:appointments.results,team:team.results,settings:Object.fromEntries((settings.results as {key:string;value:string}[]).map(x=>[x.key,x.value]))});
  }catch{ return error('Données temporairement indisponibles.',503); }
}
export async function POST(request:Request){
  if(!sameOrigin(request))return error('Origine non autorisée.',403);
  try{
    const who=identity(request);if(!who.id)return error('Connexion requise.',401);
    const data=await request.json() as Record<string,unknown>;
    if(data.action==='bootstrap'){
      const claimed=await env.DB!.prepare('SELECT user_id FROM admin_owners WHERE id = 1').first<{user_id:string}>();
      if(claimed)return error('Administration déjà activée.',409);
      await env.DB!.prepare('INSERT OR IGNORE INTO admin_owners (id,user_id,email) VALUES (1,?,?)').bind(who.id,who.email||'').run();
      return (await owner(request))?Response.json({ok:true}):error('Administration déjà activée.',409);
    }
    if(!(await owner(request)))return error('Accès réservé à l’administration.',403);
    const id=Number(data.id);
    if(data.action==='status'){
      if(!Number.isInteger(id)||id<1||!['new','confirmed','completed','cancelled'].includes(String(data.status)))return error('Statut invalide.');
      await env.DB!.prepare('UPDATE appointments SET status = ? WHERE id = ?').bind(data.status,id).run();
    }else if(data.action==='team-save'){
      const name=String(data.name||'').trim().slice(0,100),role=String(data.role||'').trim().slice(0,100),bio=String(data.bio||'').trim().slice(0,500);
      if(!name||!role)return error('Nom et fonction requis.');
      if(Number.isInteger(id)&&id>0)await env.DB!.prepare('UPDATE team SET name=?,role=?,bio=? WHERE id=?').bind(name,role,bio,id).run();
      else await env.DB!.prepare('INSERT INTO team (name,role,bio,sort_order) VALUES (?,?,?,(SELECT COALESCE(MAX(sort_order),0)+1 FROM team))').bind(name,role,bio).run();
    }else if(data.action==='team-delete'){
      if(!Number.isInteger(id)||id<1)return error('Membre invalide.');
      await env.DB!.prepare('DELETE FROM team WHERE id=?').bind(id).run();
    }else if(data.action==='settings'){
      for(const key of ['cabinetName','tagline','phone','email','address','hours']){
        const value=String(data[key]??'').trim().slice(0,300);
        await env.DB!.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,value).run();
      }
    }else return error('Action inconnue.');
    return Response.json({ok:true});
  }catch{return error('Enregistrement impossible. Réessayez.',503);}
}
