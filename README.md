# Panier Recettes

Recettes, garde-manger et prix d'épicerie pour le Québec. Le français est la langue par défaut. L'anglais est un bouton dans l'en-tête.

Une recette importée sait ce qui manque dans le garde-manger. La liste d'épicerie compare le magasin le moins cher avec une répartition sur deux ou trois bannières. L'historique et les alertes de solde s'appuient sur des prix semés, des reçus, et — quand le site le permet — une lecture directe.

## Démarrage

```bash
npm install
cp .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

L'app écoute sur [http://localhost:3847](http://localhost:3847).

Compte démo: `demo@panierrecettes.ca` / `laval-demo` (Camille, H7T 2P1). Le bouton « Ouvrir le compte démo » ouvre cette cuisine: six recettes (Québec, France, Inde, Mexique, Japon, Italie), un garde-manger avec des dates courtes, la semaine en cours, la liste des manquants, huit semaines de prix pour Maxi, Provigo, IGA, Metro, Super C, Walmart et Costco, plus les moyennes mensuelles de Statistique Canada.

## Pile

- Next.js 15 (App Router) et React 19, TypeScript, Tailwind 4
- Prisma 6: SQLite en local (`file:./dev.db`), Postgres en changeant `provider` dans `prisma/schema.prisma`
- Session signée dans le cookie `pr_session` (pas de NextAuth)
- Vitest pour le parse des ingrédients, l'appariement, le coût, la répartition, les alertes, robots.txt, le JSON-LD et l'adaptateur Metro
- Service optionnel `services/recipe-scraper` (`recipe-scrapers`) quand une page n'a pas de schema.org
- PWA: manifeste + `public/sw.js`. Les écrans appellent `/api` en URL relative, pour un futur emballage Capacitor ([docs/CAPACITOR.md](docs/CAPACITOR.md))

## Variables

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | SQLite local, ou URL Postgres |
| `SESSION_SECRET` | Signature du cookie |
| `DEFAULT_POSTAL_CODE` | Code postal des observations (défaut Laval, `H7T2P1`) |
| `RECEIPT_AI_API_KEY` | Optionnel. API compatible OpenAI pour une page sans données structurées et, plus tard, un reçu illisible |
| `RECEIPT_AI_BASE_URL`, `RECEIPT_AI_MODEL` | Fournisseur et modèle |
| `STORE_MAXI` … `STORE_COSTCO` | `off` coupe cet adaptateur |
| `SCRAPE_DELAY_MS` | Pause minimale entre deux requêtes vers le même hôte |
| `SCRAPE_BROWSER` | Inutilisé. Aucun navigateur n'est lancé pour contourner un blocage |
| `RECIPE_SCRAPER_PYTHON` | Interpréteur pour `services/recipe-scraper/scrape.py` |

Sans clé d'IA, l'import lit le JSON-LD schema.org, le microdata, puis recipe-scrapers s'il est installé.

```bash
python3 -m pip install -r services/recipe-scraper/requirements.txt
```

## Import de recettes

`/recipes/import` télécharge la page (adresses publiques seulement; les redirections vers un réseau privé sont refusées) et choisit la recette schema.org qui correspond à l'URL, sinon la plus complète. Les lignes deviennent quantité, unité, aliment et note, en français ou en anglais, avec les conversions métriques / impériales. La cuisine et l'origine sont déduites du texte quand la page ne les donne pas.

Vérifier quelques sites:

```bash
npm run recipes:probe
```

## Prix

Le coût d'une recette a deux chiffres:

- **À acheter**: le prix des emballages pour la quantité qui manque au garde-manger. Un aliment au poids est calculé au prorata.
- **Coût complet**: la valeur de tout ce que la recette utilise, même ce qui est déjà à la maison.

La liste choisit le magasin unique le moins cher, puis la combinaison de deux ou trois magasins qui baisse le total. Une moyenne StatCan comble un trou et n'est pas comptée comme un magasin.

Les alertes comparent le dernier prix à la médiane des observations précédentes. Une baisse d'au moins 10 % ouvre une alerte. Dans les données semées: bœuf haché chez Maxi, beurre chez Metro, poitrine de poulet chez Super C.

```bash
npm run prices:probe          # affiche l'état de chaque adaptateur
npm run prices:probe -- --save  # enregistre les prix réellement lus
```

Le détail des bannières, de robots.txt et des conditions d'utilisation est dans [docs/SCRAPING.md](docs/SCRAPING.md).

Résultat honnête des sondes: **Metro** renvoie des prix sur une page thématique autorisée (pas un catalogue complet). **Maxi, Provigo, IGA et Super C** répondent 403 et sont marqués bloqués, sans deuxième essai. **Walmart** interdit la recherche dans robots.txt: ces URL ne sont pas appelées. **Costco** renvoie une coquille sans prix. Les tests Metro restent sur un fixture HTML.

## Postgres

```bash
docker compose up -d db
# dans une copie du schema dont le provider est postgresql
DATABASE_URL=postgresql://panier:panier@localhost:5432/panier npx prisma db push
```

L'image Docker fait le même remplacement de provider quand on la construit avec `DATABASE_PROVIDER=postgresql`.

## Tests

```bash
npm test
```

## Risques

Lire un site d'épicerie peut être contraire à ses conditions d'utilisation même si robots.txt laisse passer l'URL. Le rythme est lent, chaque bannière a un interrupteur, et un 403 arrête l'adaptateur. Ne pas republier ces prix. Les montants semés sont un échantillon pour la démo, pas un relevé de caisse. Les moyennes StatCan sont mensuelles et provinciales: elles servent d'ordre de grandeur.

## Ensuite

- Étendre l'adaptateur Metro au-delà de la page « produits d'ici », seulement sur des URL permises.
- Laisser Maxi, Provigo, IGA, Super C, Walmart et Costco hors ligne tant qu'ils bloquent ou ne rendent pas de prix. Un partenariat ou un flux officiel vaudrait mieux qu'un contournement.
- Photos de reçus via la clé `RECEIPT_AI_*`.
- Emballage Capacitor une fois l'hôte HTTPS en place.
- Comptes vérifiés par courriel, et une sauvegarde Postgres en production.
