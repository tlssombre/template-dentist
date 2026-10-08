# Template de cabinet dentaire

Site vitrine animé avec bouton de réservation flottant, calendrier compact et administration des rendez-vous, horaires, absences, équipe et accès employés.

## Démarrage

```bash
npm ci
npm run dev
```

Le site visiteur est à `/landing.html` (la racine y redirige) et l’administration à `/admin`. La base D1 est déclarée dans `.openai/hosting.json`. Les migrations sont versionnées dans `drizzle/`. Après une modification de `db/schema.ts`, lancer `npm run db:generate` avant publication.

## Réservations et disponibilités

Le calendrier s’ouvre dans une fenêtre depuis le bouton flottant présent sur le site. Il affiche les 90 prochains jours, par créneaux de 30 minutes, en heure d’Abidjan (GMT). Les horaires par défaut sont du lundi au vendredi de 9 h à 17 h, le samedi de 9 h à 13 h et le dimanche fermé. L’admin peut changer les horaires hebdomadaires et bloquer des heures précises.

Une demande reste **en attente** et ne réserve pas encore le créneau. En l’acceptant, l’admin le rend immédiatement indisponible dans le calendrier visiteur. Une contrainte unique en base empêche deux rendez-vous acceptés sur la même date et heure. L’annulation libère le créneau. Le statut « Terminé » conserve le créneau occupé dans l’historique. La disponibilité est revérifiée à l’envoi et à l’acceptation.

Le formulaire ne réserve pas automatiquement un rendez-vous confirmé et n’envoie pas de notification. Les anciennes demandes sans créneau restent consultables, mais doivent être recréées avec une date pour être acceptées.

## Accès à l’administration

Le premier utilisateur connecté au **Site privé** active l’administration à `/admin` et devient propriétaire. Il faut le faire avant tout changement de partage. Le propriétaire peut créer des accès employés par adresse e-mail :

- **Responsable** : rendez-vous, calendrier, équipe et informations ;
- **Accueil** : rendez-vous et calendrier ;
- **Contenu** : équipe et informations.

L’accès employé est vérifié sur le serveur à partir de l’adresse du compte ChatGPT connecté. Un employé doit également avoir accès au Site dans les réglages de partage ; l’ajout de son e-mail dans l’admin ne crée pas de compte ChatGPT et ne modifie pas le partage du Site. Le propriétaire seul gère les accès et peut les désactiver ou supprimer.

La section équipe reste visible avec un état d’attente tant qu’aucun profil n’est ajouté. L’équipe et les coordonnées saisies dans l’admin apparaissent sur le site visiteur. Les textes des soins restent dans `public/landing.html`.

## Vérification

```bash
npx tsc --noEmit
npm run build
```

Pour utiliser le code hors de Sites, configurer un environnement Cloudflare compatible avec le binding D1 `DB` et un fournisseur d’identité qui transmet de façon fiable les en-têtes d’utilisateur attendus.

## Déploiement sur Render

Le fichier `render.yaml` prépare un service Node avec disque persistant. Connectez ce dépôt comme Blueprint Render : le build installe les dépendances et compile le site, puis `start:render` applique les migrations D1 locales et démarre le serveur sur le port fourni par Render. Le disque conserve les rendez-vous lors des redéploiements. Le service doit rester sur une seule instance.

1. Placez le projet dans un dépôt GitHub ou GitLab et poussez la branche contenant `render.yaml`.
2. Dans Render, ouvrez **New → Blueprint**, connectez ce dépôt et choisissez cette branche.
3. Vérifiez le service `dental-house`, le plan `starter` et le disque persistant, puis lancez **Deploy Blueprint**. Ce choix est payant : Render ne propose pas de disque persistant sur un service Web gratuit.
4. Une fois le service démarré, ouvrez l'URL `onrender.com` indiquée par Render. La racine redirige vers `/landing.html`.

Le serveur écoute le port `PORT` fourni par Render sur `0.0.0.0`. Le démarrage applique automatiquement les migrations. Conservez le disque attaché au service pour garder les demandes de rendez-vous et les médias locaux.

Cette configuration exécute le Worker Cloudflare dans l’environnement local de Wrangler. Elle permet de présenter le site et de recevoir les demandes, mais l’administration privée dépend encore de l’identité fournie par Sites. Pour exploiter l’administration sur Render, il faut brancher un véritable fournisseur d’identité côté serveur avant la mise en ligne. Les médias ajoutés via le stockage R2 local doivent aussi rester sur le disque persistant si cette fonction est utilisée.
