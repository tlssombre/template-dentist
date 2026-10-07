import { env } from 'cloudflare:workers';
export const DEFAULT_HOURS = [
  {weekday:0,isOpen:0,startTime:'09:00',endTime:'17:00'},
  ...[1,2,3,4,5].map(weekday=>({weekday,isOpen:1,startTime:'09:00',endTime:'17:00'})),
  {weekday:6,isOpen:1,startTime:'09:00',endTime:'13:00'},
];
export const isDate = (date:string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date+'T00:00:00Z')) && new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date;
export const isTime = (time:string) => /^(?:0[8-9]|1\d|20):(?:00|30)$/.test(time);
export const inWindow = (date:string) => isDate(date) && date>=new Date().toISOString().slice(0,10) && date<=new Date(Date.now()+90*86400000).toISOString().slice(0,10);
export const minutes=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3));
export function ruleFor(weekday:number, rows:{weekday:number;isOpen:number;startTime:string;endTime:string}[]){return rows.find(r=>r.weekday===weekday)??DEFAULT_HOURS[weekday]}
export async function getCalendar(date:string){
  const [hours,blocks,confirmed]=await Promise.all([
    env.DB!.prepare('SELECT weekday,is_open AS isOpen,start_time AS startTime,end_time AS endTime FROM weekly_hours').all(),
    env.DB!.prepare('SELECT id,time,note FROM calendar_blocks WHERE date=? ORDER BY time').bind(date).all(),
    env.DB!.prepare("SELECT slot_time AS time FROM appointments WHERE scheduled_date=? AND status IN ('confirmed','completed')").bind(date).all(),
  ]);
  const rule=ruleFor(new Date(date+'T00:00:00Z').getUTCDay(),hours.results as {weekday:number;isOpen:number;startTime:string;endTime:string}[]);
  const blocked=new Set((blocks.results as {time:string}[]).map(x=>x.time));
  const booked=new Set((confirmed.results as {time:string}[]).map(x=>x.time));
  const now=new Date();const today=now.toISOString().slice(0,10);const current=now.getUTCHours()*60+now.getUTCMinutes();
  const slots=[];
  for(let m=8*60;m<=20*60;m+=30){
    const time=`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    const closed=!rule.isOpen||m<minutes(rule.startTime)||m+30>minutes(rule.endTime);
    const past=date===today&&m<=current;
    const reason=past?'Passé':closed?'Fermé':blocked.has(time)?'Indisponible':booked.has(time)?'Réservé':'';
    slots.push({time,available:!reason,reason});
  }
  return {date,slots,blocks:blocks.results,hours:hours.results};
}
