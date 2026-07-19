# Contact Information Module

This module stores player contact details in `world/customnpcs/scripts/data_auto/contact_information.json`.

`contactInformation_utils.js` provides the shared helpers used by both the NPC engine and `CustomServerTools.js` commands:

- `ensureContactInfo(player)` creates a file-backed entry for the player when missing.
- `getContactInfo(player)` reads the current entry for the player.
- `getOrCreateContactInfo(player)` reads the entry and creates it if needed.
- `setContactInfoEmail(uuid, email)` updates the stored email.
- `setContactInfoBirthday(uuid, day, month, year)` updates the stored birthday string.

The `!contact` commands in `CustomServerTools.js` and the NPC interaction script both use the same JSON-backed helpers so contact data stays in one place.

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.