
var FACTION_ID_FULLFRIENDLY = 16
var FACTION_ID_DEFAULT = 12
var FACTION_ID_FULLAGGRESSIVE = 11
var FACTION_ID_CRIMINAL = 6
var FACTION_ID_CIVILITY = 2
var FACTION_ID_MAFIA = 7
var FACTION_ID_COMBATNPC_ONE = 19
var FACTION_ID_COMBATNPC_TWO = 20
var FACTION_ID_QUESTNPC = 13
var FACTION_ID_DEV = 15
var FACTION_ID_EDUCATION = 3
var FACTION_ID_ROADHOG = 17

// function to check if the player is a Criminal
function isCriminal(player) {
    return player.getFactionPoints(FACTION_ID_CRIMINAL) > 1800
}

function getFactionDescription(faction_id) {
    var description

    switch (faction_id) {
        case FACTION_ID_FULLFRIENDLY:
            description = [
                "Full Friendly",
                "Faction ID: " + FACTION_ID_FULLFRIENDLY,
                "Default Points: 1000",
                "Agressive: < 0",
                "Friendly: > 10",
                "Description: This faction cannot attack nor be attacked by players. Mostly used for NPC props.",
                "Example: Easter eggs, bank shelves, etc.",
            ]
            break
        case FACTION_ID_DEFAULT:
            description = [
                "Neutral",
                "Faction ID: " + FACTION_ID_DEFAULT,
                "Default Points: 1000",
                "Agressive: < 500",
                "Friendly: > 1500",
                "Description: This faction is neutral to all players. Mostly used for civilians.",
                "Example: Civilians, Shopkeepers, etc.",
            ]
            break
        case FACTION_ID_FULLAGGRESSIVE:
            description = [
                "Full Aggressive",
                "Faction ID: " + FACTION_ID_FULLAGGRESSIVE,
                "Default Points: 0",
                "Agressive: < 500",
                "Friendly: > 1500",
                "Description: This faction is aggressive to all players. Mostly used for hostile NPCs.",
                "Example: World Bosses, Anomalies, etc.",
            ]
            break
        case FACTION_ID_CRIMINAL:
            description = [
                "Criminal",
                "Faction ID: " + FACTION_ID_CRIMINAL,
                "Default Points: 1000",
                "Agressive: < 500",
                "Friendly: > 2000",
                "Description: This faction is a farmable criminal faction. Players, depending on quests or activteis can be friendly, neutra, or agressive towards criminals.",
                "Realtionship: They will attack 'Civility' faction.",
                "Example: Bandits, Thieves, etc.",
            ]
            break
        case FACTION_ID_CIVILITY:
            description = [
                "Civility",
                "Faction ID: " + FACTION_ID_CIVILITY,
                "Default Points: 1000",
                "Agressive: < 500",
                "Friendly: > 5000",
                "Description: This faction is a farmable civility faction. Players, depending on quests or activteis can be friendly, neutra, or agressive towards civility.",
                "Realtionship: They will attack 'Criminal' faction.",
                "Example: Police, Guards, SPO, Military, etc.",
            ]
            break
        case FACTION_ID_MAFIA:
            description = [
                "Mafia",
                "Faction ID: " + FACTION_ID_MAFIA,
                "Default Points: 1000",
                "Agressive: < 500",
                "Friendly: > 5000",
                "Description: This faction is a farmable mafia faction. Players, depending on quests or activteis can be friendly, neutra, or agressive towards mafia. The Mafia is like criminals, but they are discrete, so the Civility faction will not attack them.",
                "Realtionship: They won't attack, nor be attacked, but they will defend themselves.",
                "Example: Mafia.",
            ]
            break
        case FACTION_ID_COMBATNPC_ONE:
            description = [
                "{Combat NPC Team 1}",
                "Faction ID: " + FACTION_ID_COMBATNPC_ONE,
                "Default Points: 1000",
                "Agressive: < 500",
                "Friendly: > 1500",
                "Description: This faction is a combat NPC faction. Players are not involved. It is used for quests or combats between NPCs.",
                "Realtionship: They will attack '{Combat NPC Team 2}' faction.",
                "Example: Combat NPCs.",
            ]
            break
        case FACTION_ID_COMBATNPC_TWO:
            description = [
                "{Combat NPC Team 2}",
                "Faction ID: " + FACTION_ID_COMBATNPC_TWO,
                "Default Points: 1000",
                "Agressive: < 500",
                "Friendly: > 1500",
                "Description: This faction is a combat NPC faction. Players are not involved. It is used for quests or combats between NPCs.",
                "Realtionship: They will attack '{Combat NPC Team 1}' faction.",
                "Example: Combat NPCs.",
            ]
            break
        case FACTION_ID_QUESTNPC:
            description = [
                "Quest NPC",
                "Faction ID: " + FACTION_ID_QUESTNPC,
                "Default Points: 1000",
                "Agressive: < 500",
                "Friendly: > 1500",
                "Description: This faction is a quest NPC faction. Players are not involved. It is used for quests.",
                "Realtionship: They won't attack, nor be attacked.",
                "Example: Quest NPCs.",
            ]
            break
        case FACTION_ID_DEV:
            description = [
                "Developer",
                "Faction ID: " + FACTION_ID_DEV,
                "Default Points: 1000",
                "Agressive: < 500",
                "Friendly: > 1500",
                "Description: This faction is for dev and debug. Players are not involved.",
                "Example: Developers.",
            ]
            break
        case FACTION_ID_EDUCATION:
            description = [
                "{Education}",
                "Faction ID: " + FACTION_ID_EDUCATION,
                "Default Points: 0",
                "Agressive: < 0",
                "Friendly: > 15000",
                "Description: This is not a faction, but a score. It can be grown by doing quests or activities. It can be gained by reading lore and doing lore-related activities or quests.",
                "Example: heading to Gramados History Museum, visiting historical landmarks, etc.",
            ]
            break
        case FACTION_ID_ROADHOG:
            description = [
                "{Roadhog Score}",
                "Faction ID: " + FACTION_ID_ROADHOG,
                "Default Points: 0",
                "Agressive: < 0",
                "Friendly: > 0",
                "Description: This is not a faction, but a score. Originally a joke, it represents how bad your driving skills are. This feature is mostly deprecated.",
                "Example: Driving a car and blowing it up, driving into a wall, etc.",
            ]
            break
        default:
            description = [
                "Unknown Faction",
                "Faction ID: " + faction_id,
                "Description: This faction is unknown.",
            ]
            break
        }
    return description
}

