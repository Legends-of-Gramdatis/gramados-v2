load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_factions.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_emotes.js')

// Load config
var config = loadJson("/home/mouette/gramados-v2/world/customnpcs/scripts/ecmascript/modules/mafia/mafia_config.json");

var MIN_MAFIA_REP = config.min_rep;
var MAX_REP_PURCHASE = config.max_rep_purchase;
var REP_COST_DIVISOR = config.cost_multiplier;

var LAST_TICKET_TIME_KEY = "last_ticket_time";
var SIX_HOURS_IN_TICKS = TimeToTick(6,0,0);

var MAFIA_DATA_PATH = "/home/mouette/gramados-v2/world/customnpcs/scripts/data_auto/mafia.json";

function loadMafiaData() {
    return checkFileExists(MAFIA_DATA_PATH) ? loadJson(MAFIA_DATA_PATH) : { players: {}, tickets: [] };
}

function saveMafiaData(data) {
    saveJson(data, MAFIA_DATA_PATH);
}

function interact(event) {
    var player = event.player;
    var world = player.getWorld();
    var item = player.getMainhandItem();
    var rep = player.getFactionPoints(FACTION_ID_MAFIA);

    var mafiaData = loadMafiaData();
    var playerName = player.getName();
    var currentTime = getAgeTick(world);

    if (!mafiaData.players[playerName]) {
        mafiaData.players[playerName] = { lastTicketTime: 0 };
    }

    var lastTicketTime = mafiaData.players[playerName].lastTicketTime;

    // === Step 2: Player is holding a ticket
    if (!item.isEmpty() && item.getName() === "minecraft:paper") {
        var lore = item.getLore();
        var ticketId = null;

        for (var i = 0; i < lore.length; i++) {
            if (lore[i].startsWith("§8§oTicket ID: ")) {
                ticketId = lore[i].substring("§8§oTicket ID: ".length);
                break;
            }
        }

        if (!ticketId) {
            tellPlayer(player, "§cThis ticket seems... tampered with.");
            logToFile("mafia", player.getName() + " attempted to use a tampered ticket.");
            return;
        }

        var ticket = null;
        for (var j = 0; j < mafiaData.tickets.length; j++) {
            if (mafiaData.tickets[j].id === ticketId) {
                ticket = mafiaData.tickets[j];
                break;
            }
        }

        if (!ticket) {
            tellPlayer(player, "§cThis ticket is invalid.");
            logToFile("mafia", player.getName() + " attempted to use an invalid ticket.");
            return;
        }

        if (rep >= MIN_MAFIA_REP) {
            tellPlayer(player, "§cYou're already in decent standing. This ticket is void.");
            logToFile("mafia", player.getName() + " tried to use a ticket but already has sufficient reputation.");
            return;
        }

        var repGain = ticket.repGain;
        var costInCents = ticket.costInCents;

        if (!extractMoneyFromPouch(player, costInCents)) {
            tellPlayer(player, "§cYou don't have the cash for this deal.");
            logToFile("mafia", player.getName() + " tried to use a ticket but lacked the funds.");
            return;
        }

        var heldStack = item.copy();
        heldStack.setStackSize(heldStack.getStackSize() - 1);
        player.setMainhandItem(heldStack);

        grantBadgeAndEmotes(player, "blood_money", ["heart_dark", "hphalf", "book_quill", "strength"]);

        player.addFactionPoints(FACTION_ID_MAFIA, repGain);
        tellPlayer(player, "§aYour reputation has been... adjusted.");
        tellPlayer(player, "§7You gained §e" + repGain + "§7 Mafia reputation.");
        logToFile("mafia", player.getName() + " gained " + repGain + " reputation for " + getAmountCoin(costInCents) + " using ticket " + ticketId + ".");

        // Remove the validated ticket from the list
        mafiaData.tickets = mafiaData.tickets.filter(function(t) {
            return t.id !== ticketId;
        });
        saveMafiaData(mafiaData);
        return;
    }

    // Check remaining time for ticket generation using a phone item
    if (!item.isEmpty() && isItemInLootTable("world/loot_tables/" + _LOOTTABLE_CELLPHONES, item.getName())) {
        var nextTicketTime = lastTicketTime + SIX_HOURS_IN_TICKS;
        var timeLeft = nextTicketTime - currentTime;

        if (timeLeft > 0) {
            tellPlayer(player, "§eTime left before you can generate a new ticket: " + TicksToHumanReadable(timeLeft));
        } else {
            tellPlayer(player, "§aYou can generate a new ticket now!");
        }
        return;
    }

    // === Step 1: Not holding ticket, generate offer
    if (rep >= MIN_MAFIA_REP) {
        tellPlayer(player, "§7You don't need any favors from us. Yet.");
        logToFile("mafia", player.getName() + " attempted to generate a ticket but already has sufficient reputation.");
        return;
    }

    if (currentTime - lastTicketTime < SIX_HOURS_IN_TICKS) {
        tellPlayer(player, "§cYou can only generate a ticket every 6 hours.");
        return;
    }

    var repGap = MIN_MAFIA_REP - rep;
    var repToOffer = Math.min(MAX_REP_PURCHASE, repGap);

    var costInG = Math.round(repToOffer * (repGap / REP_COST_DIVISOR) * 10) / 10;
    var costInCents = Math.round(costInG * 100);

    var ticketId = "ticket_" + Math.floor(Math.random() * 1000000);

    var ticket = {
        id: ticketId,
        player: playerName,
        generatedDate: currentTime,
        repGain: repToOffer,
        costInCents: costInCents,
        playerRepAtGeneration: rep
    };

    mafiaData.tickets.push(ticket);
    saveMafiaData(mafiaData);

    var ticketItem = world.createItem("minecraft:paper", 0, 1);
    ticketItem.setCustomName("§cMafia Reputation Buyback");
    ticketItem.setLore([
        "§8[Reputation Ticket]",
        "§7Worth: §e" + repToOffer + "§7 rep",
        parseEmotes("§7Cost: §r:money:§e" + getAmountCoin(costInCents)),
        "§8§oTicket ID: " + ticketId
    ]);

    tellPlayer(player, "§7One-time offer. Pay up and we forget.");
    player.giveItem(ticketItem);

    mafiaData.players[playerName].lastTicketTime = currentTime;
    saveMafiaData(mafiaData);

    logToFile("mafia", player.getName() + " generated a ticket worth " + repToOffer + " reputation for " + getAmountCoin(costInCents) + ".");
}
