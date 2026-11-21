# Editable vector background library

The workspace includes four original, hand-authored vector scene starters: daytime city, forest, interior room, and night city. Each scene is composed from ordinary validated SVG path operations grouped into separate editable layers. Background layers are inserted below existing character/ink layers, remain part of the ZERO project, and are included in SVG/ZIP exports.

This is a starter library, not a full background department or a perspective/layout editor. Artists can select, recolor, move, and edit the generated paths with existing workspace tools. No raster/image-generation service is used.

## Validation
- Each preset is created from explicit path geometry and passes the same SVG path validation as user drawings.
- Layer and operation caps are checked before insertion.
- Automated tests cover all presets, stacking order, invalid preset/capacity handling, and project round-trip persistence.
