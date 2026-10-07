import { getRole,can,fail,person,sameOrigin } from '@/lib/admin-access';
import { mediaBucket } from '@/lib/before-after';

export async function POST(request:Request){
  if(!sameOrigin(request))return fail('Origine non autorisée.',403);
  if(!person(request).id)return fail('Connexion requise.',401);
  try{
    if(!can(await getRole(request),'content'))return fail('Accès réservé au personnel autorisé.',403);
    const bucket=mediaBucket();
    if(!bucket)return fail('Stockage des images indisponible.',503);
    const form=await request.formData(),image=form.get('image');
    if(!(image instanceof File))return fail('Choisissez une image.');
    const formats:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
    const extension=formats[image.type];
    if(!extension||image.size<1||image.size>5_000_000)return fail('Utilisez une image JPG, PNG ou WebP de moins de 5 Mo.');
    const key=`before-after/${crypto.randomUUID()}.${extension}`;
    await bucket.put(key,await image.arrayBuffer(),{httpMetadata:{contentType:image.type}});
    return Response.json({url:'/api/before-after-media?key='+encodeURIComponent(key)});
  }catch{return fail('Envoi de l’image impossible. Réessayez.',503)}
}
