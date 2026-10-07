# Template de cabinet dentaire

Site vitrine animé avec calendrier de réservation et administration des rendez-vous, horaires, absences, équipe et accès employés.

## Démarrage

```bash
npm ci
npm run dev
```

Le site visiteur est à `/landing.html` (la racine y redirige) et l’administration à `/admin`. La base D1 est déclarée dans `.openai/hosting.json`. Les migrations sont versionnées dans `drizzle/`. Après une modification de `db/schema.ts`, lancer `npm run db:generate` avant publication.

## Réservations et disponibilités

Le calendrier affiche les 90 prochains jours, par créneaux de 30 minutes, en heure d’Abidjan (GMT). Les horaires par défaut sont du lundi au vendredi de 9 h à 17 h, le samedi de 9 h à 13 h et le dimanche fermé. L’admin peut changer les horaires hebdomadaires et bloquer des heures précises.

Une demande reste **en attente** et ne réserve pas encore le créneau. En l’acceptant, l’admin le rend immédiatement indisponible dans le calendrier visiteur. Une contrainte unique en base empêche deux rendez-vous acceptés sur la même date et heure. L’annulation libère le créneau. Le statut « Terminé » conserve le créneau occupé dans l’historique. La disponibilité est revérifiée à l’envoi et à l’acceptation.

Le formulaire ne réserve pas automatiquement un rendez-vous confirmé et n’envoie pas de notification. Les anciennes demandes sans créneau restent consultables, mais doivent être recréées avec une date pour être acceptées.

## Accès à l’administration

Le premier utilisateur connecté au **Site privé** active l’administration à `/admin` et devient propriétaire. Il faut le faire avant tout changement de partage. Le propriétaire peut créer des accès employés par adresse e-mail :

- **Responsable** : rendez-vous, calendrier, équipe et informations ;
- **Accueil** : rendez-vous et calendrier ;
- **Contenu** : équipe et informations.

L’accès employé est vérifié sur le serveur à partir de l’adresse du compte ChatGPT connecté. Un employé doit également avoir accès au Site dans les réglages de partage ; l’ajout de son e-mail dans l’admin ne crée pas de compte ChatGPT et ne modifie pas le partage du Site. Le propriétaire seul gère les accès et peut les désactiver ou supprimer.

L’équipe et les coordonnées saisies dans l’admin apparaissent sur le site visiteur. Les textes des soins restent dans `public/landing.html`.

## Vérification

```bash
npx tsc --noEmit
npm run build
```

Pour utiliser le code hors de Sites, configurer un environnement Cloudflare compatible avec le binding D1 `DB` et un fournisseur d’identité qui transmet de façon fiable les en-têtes d’utilisateur attendus.
