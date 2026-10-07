# Template de cabinet dentaire

Site vitrine lumineux et animé avec espace d’administration pour les demandes de rendez-vous, l’équipe et les informations du cabinet.

## Démarrage

```bash
npm ci
npm run dev
```

Le site visiteur est accessible à `/landing.html` (la racine y redirige) et l’administration à `/admin`. La base D1 est déclarée dans `.openai/hosting.json` et le schéma est versionné dans `drizzle/`. Pour modifier le schéma, éditer `db/schema.ts`, puis lancer `npm run db:generate` avant le déploiement.

## Administration

Le premier utilisateur connecté au Site privé active l’espace admin à `/admin`. Son identifiant devient le propriétaire de l’administration. Activez l’espace pendant que le Site est privé, avant de l’ouvrir aux visiteurs. L’accès aux données et toutes les modifications sont vérifiés côté serveur.

Le formulaire du site enregistre les demandes dans D1. Il ne réserve pas automatiquement un créneau et n’envoie pas de notification. L’équipe et les coordonnées saisies dans l’admin apparaissent sur le site visiteur. Les intitulés des soins et le contenu éditorial restent dans `public/landing.html`.

## Vérification

```bash
npm run build
```

Les migrations sont appliquées lors de la publication par Sites. Pour une utilisation hors de Sites, configurer un environnement Cloudflare compatible et le binding D1 `DB`.
