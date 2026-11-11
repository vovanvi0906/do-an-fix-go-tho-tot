# ==============================================================================
# UI DEBUGGING & IDENTIFIER CONVENTION (REACT NATIVE FOR WEB)
# ==============================================================================
- ALWAYS add `nativeID` to major React Native elements (View, TouchableOpacity, Pressable, TextInput, Modal, Button, Text headers) to enable instant inspection in Chrome DevTools (maps directly to HTML `id`).
- NAMING CONVENTION: Use kebab-case with hierarchical structure:
  `[screen/feature]-[section]-[element-name]`
  
  Examples:
  - Screen containers: `nativeID="home-screen-container"`
  - Sections/Grids: `nativeID="home-category-grid"`, `nativeID="home-header-section"`
  - Interactive items: `nativeID="cat-item-sua-dien"`, `nativeID="btn-submit-booking"`
  - Input fields: `nativeID="input-search-service"`
  - Modals: `nativeID="modal-ai-diagnosis-result"`

- CRITICAL RULES:
  1. Do NOT duplicate `nativeID` within the same view hierarchy.
  2. For dynamic lists (`FlatList`, `.map()`), append dynamic identifier or index:
     `nativeID={`cat-item-${category.slug || index}`}`
  3. Adding `nativeID` MUST NOT alter existing styles, props, or business logic.
