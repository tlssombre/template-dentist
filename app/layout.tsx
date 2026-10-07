import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'Cabinet Dentaire · Template', description:'Template dentaire interactif avec administration des rendez-vous et de l’équipe.', icons:{icon:'/favicon.svg'} };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}
