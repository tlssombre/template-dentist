import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'Dental House · Dr Hassan Khalil', description:'Dental House à Cocody, Abidjan : le Dr Hassan Khalil, chirurgien-dentiste spécialisé en esthétique dentaire et orthodontie.', icons:{icon:'/dental-house-logo.png'} };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}
