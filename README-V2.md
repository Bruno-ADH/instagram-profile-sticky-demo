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
