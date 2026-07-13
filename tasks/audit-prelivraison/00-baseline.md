# Baseline pre-livraison

Date : 2026-07-13 (Europe/Paris)

## Depot et environnement

- Projet : `diskoov-v15`
- Branche controlee : `refonte/conseiller-diskoov-v2`
- Commit de depart : `ba7ff57aa1159fb82b02d3ead3f798984b612568`
- Worktree au depart : propre
- URL locale : `http://127.0.0.1:5179/index.html?advisor=1`
- Runtime declare : Node.js 20.x
- Serveur local : reponse HTTP 200 sur le port 5179

## Sources inventoriees

- `../Documentations regles` : 34 fichiers originaux (PDF, DOCX, XLS/XLSX/XLSM et images)
- `docs-regles` : 10 documents de consolidation
- `validation-xavier` : 4 documents
- Code metier inspecte : `product-rules.js`, `advisor-engine.js`, `advisor-v2.js`, `index.html`, `api/send-email.ts`
- Tests inspectes : 4 fichiers dans `tests`

L'inventaire ne vaut pas validation metier. Le rapport `01-regles-metier.md` doit distinguer les sources originales, les consolidations et les validations ecrites effectivement disponibles.

## Baseline automatisee

- `npm test` : 97/97 tests passes
- `npm run typecheck` : passe
- `node --check advisor-v2.js advisor-engine.js product-rules.js config.js` : passe
- `npm audit --omit=dev --audit-level=high` : 1 vulnerabilite haute transitive (`js-cookie` via `resend`), correctif disponible
- Recherche de secrets usuels : aucun secret reel detecte dans les fichiers suivis
- `vercel build --yes` : build preview termine, mais son output statique ne contient que `index.html`, `config.js` et les polices. Le CSS, les scripts applicatifs, le logo et les images sont absents, ce qui confirme le bloqueur de deploiement `SEC-01`.

## Captures de reference

- `captures/00-baseline-1440.jpg`
- `captures/00-baseline-390.jpg`

La capture mobile a ete cadree a 390 px. Les captures ne remplacent pas les mesures DOM, les controles de debordement et les parcours interactifs.

## Limites de cette baseline

- Aucun email reel n'a ete envoye.
- Aucun appareil physique, Safari iOS, TalkBack ou VoiceOver n'a ete teste.
- Le deploiement Vercel n'est pas lie localement a un projet (`.vercel/project.json` absent).
- Les variables de production et la reception CRM ne sont pas accessibles localement.
- La recette finale avec Diskoov reste une etape humaine obligatoire.
