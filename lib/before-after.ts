import { env } from 'cloudflare:workers';

export type BeforeAfterCase = {
  id: number;
  title: string;
  treatment: string;
  imageUrl: string;
  afterOnTop: number;
  visible: number;
  sortOrder: number;
};

export const initialCases: BeforeAfterCase[] = [
  {id:1,title:'Sourire 01',treatment:'Transformation du sourire',imageUrl:'/avant-apres-1-avant.jpg',afterOnTop:1,visible:1,sortOrder:1},
  {id:2,title:'Sourire 02',treatment:'Transformation du sourire',imageUrl:'/avant-apres-1-apres.jpg',afterOnTop:1,visible:1,sortOrder:2},
  {id:3,title:'Sourire 03',treatment:'Transformation du sourire',imageUrl:'/avant-apres-2-avant.jpg',afterOnTop:1,visible:1,sortOrder:3},
  {id:4,title:'Sourire 04',treatment:'Transformation du sourire',imageUrl:'/avant-apres-2-apres.jpg',afterOnTop:1,visible:1,sortOrder:4},
];

export async function getBeforeAfterCases(includeHidden=false): Promise<BeforeAfterCase[]> {
  const db=env.DB!;
  const seeded=await db.prepare("SELECT value FROM settings WHERE key='before_after_seeded'").first<{value:string}>();
  if(!seeded){
    await db.batch([
      ...initialCases.map(item=>db.prepare('INSERT OR IGNORE INTO before_after_cases (id,title,treatment,image_url,after_on_top,visible,sort_order) VALUES (?,?,?,?,?,?,?)').bind(item.id,item.title,item.treatment,item.imageUrl,item.afterOnTop,item.visible,item.sortOrder)),
      db.prepare("INSERT OR IGNORE INTO settings (key,value) VALUES ('before_after_seeded','1')"),
    ]);
  }
  const query=includeHidden
    ?'SELECT id,title,treatment,image_url AS imageUrl,after_on_top AS afterOnTop,visible,sort_order AS sortOrder FROM before_after_cases ORDER BY sort_order,id'
    :'SELECT id,title,treatment,image_url AS imageUrl,after_on_top AS afterOnTop,visible,sort_order AS sortOrder FROM before_after_cases WHERE visible=1 ORDER BY sort_order,id';
  const rows=await db.prepare(query).all<BeforeAfterCase>();
  return rows.results;
}

export function mediaBucket(){return (env as unknown as {MEDIA?:R2Bucket}).MEDIA}
