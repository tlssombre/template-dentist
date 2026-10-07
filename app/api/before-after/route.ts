import { getBeforeAfterCases,initialCases } from '@/lib/before-after';

export async function GET(){
  try{
    const cases=await getBeforeAfterCases();
    return Response.json({cases},{headers:{'Cache-Control':'no-store'}});
  }catch{
    return Response.json({cases:initialCases},{headers:{'Cache-Control':'no-store'}});
  }
}
