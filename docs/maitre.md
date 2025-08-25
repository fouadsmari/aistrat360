## Workflow que tu dois suivre toi (claude)

✅ **OBLIGATOIRE** : avant de commencer la création ou modification il faut respecter les instructions ci-dessous :

0. ✅ **OBLIGATOIRE** tes modifications doivent respecter mes instructions nis plus ni moins.
1. ✅ **OBLIGATOIRE** Respecter Obligatoirement la documentation officielle des modules, environnements, api, worflow, database, sécurités et services.
2. ✅ **OBLIGATOIRE** Suivre leurs best practices
3. ✅ **OBLIGATOIRE** s'assurer d'avoir toujours un code clean
4. ✅ **OBLIGATOIRE** les commentaires dans les codes en anglais
5. ✅ **OBLIGATOIRE** Consulter la documentation officielle avant d'implémenter une solution
6. ❌ **INTERDIT ABSOLU** Créer ou modifier du code sans respecter les standards officiels
7. ❌ **INTERDIT ABSOLU** utiliser des solutions deprecated ou non recommandées
8. ❌ **INTERDIT ABSOLU** ignorer les recommandations de sécurité et performance
9. ✅ **OBLIGATOIRE** Mettre ce que tu t'apprête à faire dans le roadmap avant de commencer
10. ✅ **OBLIGATOIRE** vérifier si une fonctionnalité similaire existe déjà pour ne pas se répéter
11. ✅ **OBLIGATOIRE** Si tu as mal compris ma demande de me poser des questions pour mieux comprendre
12. ❌ **INTERDIT ABSOLU** de faire quelque chose qui vas à l'encontre des recommandations et ou le fonctionnement de l'app et me revenir avec des explications.

✅ **OBLIGATOIRE** : Pendant que tu corrige un bug ou développe une nouvelle fonctionnalité

1. ❌ **INTERDIT ABSOLU** de créer une data fake ou mockup
2. ❌ **INTERDIT ABSOLU** créer des fichier simplifier
3. ❌ **INTERDIT ABSOLU** de détourner un bug et ne pas le corriger à la source
4. ❌ **INTERDIT ABSOLU** de trouver un bug et l'ignorer même s'il n'ai pas lié à ce que nous sommes entrain de corriger ou créer
5. ❌ **INTERDIT ABSOLU** laisser des codes ou page ou composant ou élement ou fonction qui n'ont plus rien à faire dans l'app
6. ❌ **INTERDIT ABSOLU** laisser des log aprés avoir corriger les bug
7. ❌ **INTERDIT ABSOLU** : Utiliser la méthode HTTP PUT (Vercel incompatible - utiliser POST)
8. **VÉRIFIER obligatoire** pose toi cette question et vérifie si les modifications ne viole pas les instructions de ce fichier.
9. **VÉRIFIER obligatoire** si les composants, les boutons, le contenu, les fonctionnalité tout à bien était intégrer dans la base de donnée et les api sont crée.
10. ❌ **INTERDIT ABSOLU** ne jamais créer un bouton, un graphic ou autre sans mettre en place tout ce qui est nécessaire à son fonctionnement
11. **VÉRIFIER obligatoire** minimiser le code le rendre clean, optimiser et pense performance et ne pas se répéter.
12. **VÉRIFIER obligatoire** pense à l'éxpérience utilisateur et que l'app vas être en prod et doit être fonctionnelle
13. **VÉRIFIER obligatoire** l'implémentation ou correction de bug que tu doit mettre en place doit être cohérente avec l'app, robuste et ne créer pas de bug ailleur dans l'app.
14. il faut faire un check deploy aprés avoir terminé ton implémentation ou correction de bug, si erreurs corrige les
15. **VÉRIFIER obligatoire** aprés avoir fini il faut s'assurer si une erreur dans la console log et ou des bug nextjs s'affiche dans le navigateur si oui ne reviens pas vers moi sans les corriger.
16. pour toute modification et gestion de base tu as le cli tu pourra tout faire toi même

Mon nouveau processus OBLIGATOIRE :

1. Avant chaque modification de code :
   npm run type-check # Vérifier qu'il n'y a pas d'erreurs TypeScript
   npm run lint # Vérifier ESLint
2. Après chaque modification de code :
   npm run validate # TypeScript + ESLint + Format check
   npm run test # Si des tests existent
3. Si erreurs détectées :
   npm run lint:fix # Corriger automatiquement
   npm run format # Formatter le code

# Puis corriger manuellement ce qui reste

✅ **OBLIGATOIRE** : Aprés avoir fini la correction d'un bug ou création de nouvelle fonctionnalité :

0. ✅ **OBLIGATOIRE** réflechi si tes modifications viole les instructions dans ce fichier, si oui annule tes modification et fait en sorte que tes corrections ou développement le respecte.
1. ✅ **OBLIGATOIRE** fait un check deploy et corrige toutes les erreurs sans exception
2. ✅ **OBLIGATOIRE** lance l'app et teste si ta correction et ou ta nouvelle création fonctionne correctement, qu'elle n'a pas de beug, que la ou les pages n'affichent pas d'erreur que le console log n'a pas d'erreur.
3. ✅ **OBLIGATOIRE** me revenir seulement quand tu es 100% sur que l'environnement local est bien lancé et n'a aucun erreur si le cas contraire corrige.
4. ✅ **OBLIGATOIRE** met à jour le roadmap

---

## 📋 RÈGLES ABSOLUES DE DÉVELOPPEMENT

### 🔍 VÉRIFICATION OBLIGATOIRE AVANT CRÉATION

**AVANT de créer QUOI QUE CE SOIT, je DOIS OBLIGATOIREMENT :**

1. **🔍 AUDIT COMPLET DE L'EXISTANT** :
   - ✅ **SEARCH** tous les composants similaires (Glob + Grep)
   - ✅ **VÉRIFIER** les tables/modèles database existants
   - ✅ **ANALYSER** les fonctions/hooks similaires
   - ✅ **EXAMINER** les pages/routes équivalentes
   - ✅ **IDENTIFIER** les types/interfaces similaires

2. **📋 PROCESSUS DE VÉRIFICATION SYSTÉMATIQUE** :

   ```bash
   # Avant création composant
   find . -name "*.tsx" -o -name "*.ts" | grep -i "nomcomposant"
   grep -r "interface.*NomInterface" src/

   # Avant création table/modèle
   grep -r "model.*NomModel" prisma/
   grep -r "table.*nomtable" src/

   # Avant création fonction
   grep -r "function.*nomFonction" src/
   grep -r "const.*nomFonction" src/
   ```

3. **✅ DÉCISION BASÉE SUR L'AUDIT** :
   - **SI EXISTE** → **RÉUTILISER/ÉTENDRE** l'existant
   - **SI SIMILAIRE** → **ADAPTER** l'existant plutôt que créer
   - **SI AUCUN** → **CRÉER** avec nommage cohérent

4. **🚫 INTERDICTIONS ABSOLUES** :
   - ❌ **CRÉER** sans audit préalable
   - ❌ **DUPLIQUER** des composants/fonctions existants
   - ❌ **IGNORER** l'existant par facilité
   - ❌ **CRÉER** des variations mineures d'existant

### 🚫 INSTRUCTIONS VERCEL

**AVANT CHAQUE PUSH À GITHUB - PROCESSUS COMPLET OBLIGATOIRE** :

- ❌ **INTERDIT** : de créer un nouveau projet dans vercel
- ❌ **INTERDIT ABSOLU** : Utiliser la méthode HTTP PUT (Vercel incompatible - utiliser POST)

0. **Obligatoire** Ne jamais déployer sur vercel directement
1. **VÉRIFIER** pose toi cette question et vérifie si les modifications ne viole pas les instructions maître ou tes corrections viole la sécurité ou le VRAIS fonctionnement de l'app.
2. **LANCER** `npm run check-deploy`
3. **RESTER EN BOUCLE** jusqu'à résultat final
4. **CORRIGER TOUTES ERREURS** détectées
5. **RELANCER** jusqu'à 0 erreur
6. **VÉRIFIER** si les corrections ne viole pas les instructions maître si oui corrige

### 📋 GESTION OBLIGATOIRE DU ROADMAP.MD

**TU DOIS mettre à jour le roadmap.md IMMÉDIATEMENT :**

1. **📥 À CHAQUE NOUVELLE DEMANDE** :
   - ✅ **AJOUTER** la demande dans "À Faire" ou section appropriée
   - ✅ **MARQUER** comme "En Cours" quand tu commences
   - ✅ **DATER** chaque entrée

2. **🔧 PENDANT LE DÉVELOPPEMENT** :
   - ✅ **DÉPLACER** de "À Faire" vers "En Cours"
   - ✅ **MAINTENIR** une seule tâche "En Cours" maximum
   - ✅ **DÉTAILLER** les sous-étapes si complexe

3. **✅ APRÈS CHAQUE CORRECTION/IMPLÉMENTATION** :
   - ✅ **DÉPLACER** vers section "Terminé" appropriée
   - ✅ **AJOUTER** date de completion
   - ✅ **NETTOYER** la section "En Cours"
   - ✅ **METTRE À JOUR** la date en bas du fichier

### 🚨 RÈGLES ABSOLUES

1. **Données Réelles Uniquement** :
   - ❌ **INTERDIT** : Mock data, fake data, données simulées
   - ❌ **INTERDIT** : de faire des suppositions pour résoudre un bug ou un problème
   - ❌ **INTERDIT** : détourner un bug, ignorer ou le cacher
   - ❌ **INTERDIT** : créer une solution temporaire, manuelle, ne pas résoudre le vrai bug
   - ❌ **INTERDIT** : créer une page ou composant sans vérifier l'existant équivalent
   - ❌ **INTERDIT ABSOLU** : Fichiers avec "simple", "temp", "test" dans le nom
   - ❌ **INTERDIT ABSOLU** : Solutions temporaires ou simplifiées - corriger l'origine du problème
   - ❌ **INTERDIT ABSOLU** : laisser des fichiers qui n'ont aucune utilité dans l'app
   - ❌ **INTERDIT ABSOLU** : laisser des anciens codes ou mettre des bouts de code en commentaire - les supprimer
   - ✅ **OBLIGATOIRE** : Connexions API réelles dès le début
   - ✅ **OBLIGATOIRE** : trouver la vraie source de bug ou problème et le corriger
   - ✅ **OBLIGATOIRE** : Code production-ready uniquement
   - ✅ **OBLIGATOIRE** : bien organiser le code et la logique
   - ✅ **OBLIGATOIRE** : maintenir un code propre et une app propre sans fichiers inutiles

2. **Validation Technique Systématique** :
   - ✅ **OBLIGATOIRE** : Vérifier compatibilité avant toute implémentation
   - ✅ **OBLIGATOIRE** : Valider conformité aux bonnes pratiques communauté
   - ✅ **OBLIGATOIRE** : Évaluer sécurité et performance de chaque solution
   - ✅ **OBLIGATOIRE** : Proposer alternatives si demande non recommandée
   - ❌ **INTERDIT** : Implémenter sans validation technique préalable

3. **Qualité du Code - ESLint, Prettier et Jest** :
   - ✅ **OBLIGATOIRE** : Utiliser ESLint pour analyser le code avant chaque commit
   - ✅ **OBLIGATOIRE** : Utiliser Prettier pour formater le code automatiquement
   - ✅ **OBLIGATOIRE** : Écrire des tests unitaires Jest pour toute nouvelle fonctionnalité
   - ✅ **OBLIGATOIRE** : Exécuter `npm run lint` avant chaque push vers GitHub
   - ✅ **OBLIGATOIRE** : Exécuter `npm run format:check` pour vérifier le formatage
   - ✅ **OBLIGATOIRE** : Exécuter `npm test` pour s'assurer que tous les tests passent
   - ❌ **INTERDIT** : Pusher du code avec des erreurs ESLint non corrigées
   - ❌ **INTERDIT** : Commiter du code non formaté selon les règles Prettier
   - ❌ **INTERDIT** : Ajouter des fonctionnalités sans tests unitaires associés

4. **Analyse Intelligente des Demandes** :
   - ✅ **OBLIGATOIRE** : Analyser le contexte réel avant de proposer une solution
   - ✅ **OBLIGATOIRE** : Identifier si une demande complexe peut être simplifiée
   - ✅ **OBLIGATOIRE** : Proposer la solution la plus adéquate selon le contexte utilisateur
   - ✅ **OBLIGATOIRE** : Questionner les besoins réels avant d'implémenter
   - ✅ **OBLIGATOIRE** : Adapter la complexité technique aux vrais besoins
   - ✅ **OBLIGATOIRE** : Privilégier la simplicité et l'efficacité
   - ❌ **INTERDIT** : Implémenter aveuglément sans analyser le contexte
   - ❌ **INTERDIT** : Surdimensionner une solution par défaut
