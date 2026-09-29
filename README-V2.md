# Instagram Profile Collapsible — V2

Cette V2 conserve la pagination FlashList de la V1 et ajoute un vrai swipe horizontal natif entre Posts / Reels / Tagged.

## Installation dans le projet existant

```bash
npx expo install react-native-pager-view react-native-reanimated react-native-worklets react-native-gesture-handler
npx expo start -c
```

Aucune configuration Babel manuelle n'est nécessaire avec Expo SDK 57.

## Architecture

- `ProfileHeader` : overlay partagé, animé verticalement.
- `ProfileTabs` : overlay partagé, se bloque sous la TopBar.
- `PagerView` : swipe horizontal natif.
- Gesture Handler : glissement vertical depuis le profil et la barre d’onglets, avec inertie Reanimated et interruption lors d’un nouveau geste.
- `use-profile-overlay-scroll` : pilote la liste active sur le thread UI, dans les limites de son contenu.
- 3 `FlashList` : une par tab, avec pagination indépendante.
- Reanimated : le scroll vertical pilote le collapse sans `setState` à chaque frame.
- Scroll coordinator : synchronise les offsets avant le swipe pour éviter que le header réapparaisse ou qu'un espace blanc apparaisse.

La V1 est toujours disponible dans `src/screens/ProfileDemoScreen.tsx`.
La V2 est dans `src/screens/ProfilePagerDemoScreen.tsx` et est celle chargée par `App.tsx`.

## Robustesse et maintenance

- `src/constants/profile-tabs.ts` centralise les onglets, leur hauteur et le nombre de colonnes.
- `use-profile-pager` coordonne les changements de page. Un appui comme un swipe synchronise toutes les pages inactives, y compris les pages traversées.
- Les offsets observés proviennent uniquement des événements natifs de scroll. Les demandes de synchronisation restent séparées jusqu'à leur confirmation, et attendent la mise en page si nécessaire.
- Le pied de liste garantit assez de contenu pour replier le profil même avec zéro photo. Son calcul suppose les cellules carrées actuelles de `PhotoCell`.
- `photo-feed` gère les requêtes de chaque onglet : un rafraîchissement annule la requête précédente, les réponses obsolètes sont ignorées et le démontage annule les requêtes restantes.

## Vérifications

Avec Node 24, sans dépendance de test supplémentaire :

```bash
npm test
npm run typecheck
```

Les tests couvrent les courses entre requêtes, le nettoyage, les doublons, la pagination et la géométrie des listes courtes. Les gestes natifs restent à vérifier sur appareil : swipe annulé, appui du premier au dernier onglet, nouvel appui sur l'onglet actif pendant une remontée, et scroll depuis le profil ou la barre d'onglets.
