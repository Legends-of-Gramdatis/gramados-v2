# GUI Builder (Manifest → CustomNPCs GUI)

This module renders CustomNPCs `ICustomGui` instances from JSON manifests (like `gui_manifest.json`).

## Manifest format

Top-level keys:

- `gui_name`: Used to build the texture path.
- `skin_packs`: List of available skin pack folder names (e.g. `default`, `green`).
- `components`: List of components to place.

Component keys (current supported set):

- `id`: Integer component id.
- `type`: One of:
  - `button`
  - `toggle_button` (rendered like `button`)
  - `label`
  - `text_field`
  - `textured_rect`
  - `player_inventory`
- `offset`: `{ "page": <number>, "x": <tile>, "y": <tile> }`
- `size_tiles`: `{ "w": <tiles>, "h": <tiles> }`
- `label`: Optional text.
- `sheet`: For textured buttons, the texture sheet id (renders `sheet_<sheet>.png`).
- `tex`: For textured buttons/rects, `{ "x": <px>, "y": <px> }` top-left UV.

## Texture conventions

The builder expects textures to exist under:

- `minecraft:textures/gui/gui_creator/<gui_name>/<skin_pack>/background_page_<page>.png`
- `minecraft:textures/gui/gui_creator/<gui_name>/<skin_pack>/sheet_<sheet>.png`

## Usage

In any item/NPC script:

- `load('world/customnpcs/scripts/ecmascript/modules/GUI_builder/gui_builder.js');`
- Build a page GUI from a manifest:
  - `var gui = guiBuilder_buildGuiFromManifest(event, 'world/customnpcs/scripts/ecmascript/modules/GUI_builder/gui_manifest.json', { page: 1, skinPack: 'default', guiId: 1, pauseGame: false });`
  - `event.player.showCustomGui(gui);`

Notes:

- Different `offset.page` values are treated as different GUIs; call the builder again with another `page`.
- If a component uses `sheet` and also has a non-empty `label`, the button is rendered as a textured button with an overlay label at the same position.

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
