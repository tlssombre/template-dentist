import { env } from 'cloudflare:workers';
export type AdminRole='owner'|'manager'|'reception'|'content';
export function person(request:Request){return {id:request.headers.get('oai-authenticated-user-id'),email:(request.headers.get('oai-authenticated-user-email')||'').trim().toLowerCase()}}
export async function getRole(request:Request):Promise<AdminRole|null>{
  const who=person(request);if(!who.id)return null;
  const owner=await env.DB!.prepare('SELECT user_id FROM admin_owners WHERE id=1').first<{user_id:string}>();
  if(owner?.user_id===who.id)return 'owner';
  if(!owner||!who.email)return null;
  const employee=await env.DB!.prepare('SELECT role FROM staff_accounts WHERE email=? AND active=1').bind(who.email).first<{role:AdminRole}>();
  return employee?.role??null;
}
export const can=(role:AdminRole|null,task:'appointments'|'calendar'|'content'|'employees') => Boolean(role&&(role==='owner'||(role==='manager'&&task!=='employees')||(role==='reception'&&['appointments','calendar'].includes(task))||(role==='content'&&task==='content')));
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !origin||origin===new URL(request.url).origin}
export function fail(message:string,status=400){return Response.json({error:message},{status})}
