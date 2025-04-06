// Load utility modules
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');

var egg_lines = [
    "&6The egg jiggles slightly and lets out a squeaky chirp... was that a laugh?",
    "&6You feel a soft warmth radiating from within the shell. It's... unsettlingly comforting.",
    "&6The surface is covered in faint pastel glyphs. You can't read them, but they pulse slowly.",
    "&6A low hum resonates from the egg. It sounds like static... or singing?",
    "&6You press your hand against it. For a moment, it presses back.",
    "&6Something inside shifts. You're sure of it now-this egg is very much alive.",
    "&6A faint voice echoes in your mind: \"Soon...\"",
    "&6You hear squeaky laughter, distant and glitchy, like a corrupted bunny giggle.",
    "&6You swear you saw it twitch. Just a little. Right?",
    "&6It's sealed tight. Whatever's inside isn't ready. Yet.",
    "&6You hear a muffled \"boing\" from within. The egg remains still.",
    "&6Someone-or something-is watching you through the shell.",
    "&6It smells faintly of sugar and ozone. That can't be good.",
    "&6You touch it. For a second, your vision flickers pink.",
    "&6An odd breeze passes by. The egg hums louder, like it noticed.",
    "&6The egg feels heavy... impossibly heavy. But it shifts like it's weightless.",
    "&6A strange marking appears briefly, then fades before you can memorize it.",
    "&6You feel like it knows your name. You're probably imagining that.",
    "&6The egg doesn't react. Then it does. Then it doesn't again.",
    "&6Something is waiting. You're just not sure if it's excited... or hungry."
]

/**
 * Handles player interaction with the NPC.
 * @param {Object} event - The event object containing the player instance.
 */
function interact(event) {
    var player = event.player;
    var npc = event.npc;

    // tell a random line from the egg_lines array
    var random_line = egg_lines[Math.floor(Math.random() * egg_lines.length)];
    tellPlayer(player, random_line);

    // /summon area_effect_cloud ~ ~ ~ {Particle:"witchMagic",Radius:3f,Duration:20,Color:6521855,Motion:[0.0,1.0,0.0]}
    var command = "/summon area_effect_cloud " + npc.getX() + " " + (npc.getY()+0.5) + " " + npc.getZ() + " {Particle:\"mobSpellAmbient\",Radius:2.5f,Duration:10,Color:16713909,Motion:[0.0,1.5,0.0]}";
    npc.executeCommand(command);
}
