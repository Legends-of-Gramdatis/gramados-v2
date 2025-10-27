# CustomServerTools Commands Documentation

## General Commands

### !config reload
Reloads the CustomServerTools configuration.

**Usage:**
```
!config reload
```

**Permission:**
`config.reload`

### !help [...matches]
Lists all available commands.

**Usage:**
```
!help [...matches]
```

**Permission:**
`help`

### !command info <...command>
Displays information about a specific command.

**Usage:**
```
!command info <...command>
```

**Permission:**


command.info



### !chain <...commands>
Executes a chain of commands.

**Usage:**
```
!chain <...commands>
```

**Permission:**
`chain`

### !version
Displays the server software version.

**Usage:**
```
!version
```

**Permission:**


version



### !eval [...code]
Evaluates JavaScript code.

**Usage:**
```
!eval [...code]
```

**Permission:**
`eval`

### !testDynmap
Tests the Dynmap markers.

**Usage:**
```
!testDynmap
```

**Permission:**
`testDynmap`

### !announce <...msg>
Announces a message to all players.

**Usage:**
```
!announce <...msg>
```

**Permission:**
`announce`

### !fakeleave [...players]
Sends a fake leave message for specified players.

**Usage:**
```
!fakeleave [...players]
```

**Permission:**
`fakeleave`

### !fakejoin [...players]
Sends a fake join message for specified players.

**Usage:**
```
!fakejoin [...players]
```

**Permission:**
`fakejoin`

### !fakemsg <player> <team> <team_color> [...message]
Sends a fake message as another player.

**Usage:**
```
!fakemsg <player> <team> <team_color> [...message]
```

**Permission:**
`fakemsg`

### !scare [player] [type]
Scares a player with a specified sound.

**Usage:**
```
!scare [player] [type]
```

**Permission:**
`scare`

### !thunder [player]
Strikes thunder at a player's location.

**Usage:**
```
!thunder [player]
```

**Permission:**
`thunder`

### !tellraw <player> <...message>
Sends a raw JSON message to a player.

**Usage:**
```
!tellraw <player> <...message>
```

**Permission:**
`tellraw`

### !tellaction <player> <...message>
Sends an action bar message to a player.

**Usage:**
```
!tellaction <player> <...message>
```

**Permission:**
`tellaction`

### !telltitle <player> <...message>
Sends a title message to a player.

**Usage:**
```
!telltitle <player> <...message>
```

**Permission:**
`telltitle`

### !copyCoords [player]
Copies the coordinates of a player.

**Usage:**
```
!copyCoords [player]
```

**Permission:**
`copyCoords`

## Item Commands

### !item renameLore <slot> [...lore]
Renames the lore of the item in the specified slot.

**Usage:**
```
!item renameLore <slot> [...lore]
```

**Permission:**


item.renameLore



### !item rename <...name>
Renames the item in the player's main hand.

**Usage:**
```
!item rename <...name>
```

**Permission:**


item.rename



### !item addcstEnchant <name> [lvl]
Adds a custom enchantment to the item in the player's main hand.

**Usage:**
```
!item addcstEnchant <name> [lvl]
```

**Permission:**


item.addEnchant



### !item addSellItem
Adds the item in the player's offhand as a chance item to the sell item in the main hand.

**Usage:**
```
!item addSellItem
```

**Permission:**


item.addSellItem



### !item removecstEnchant <name>
Removes a custom enchantment from the item in the player's main hand.

**Usage:**
```
!item removecstEnchant <name>
```

**Permission:**


item.removeEnchant



### !item setAttr <slot> <attribute> <value>
Sets an attribute for the item in the player's main hand.

**Usage:**
```
!item setAttr <slot> <attribute> <value>
```

**Permission:**


item.setAttr



### !setMagAmmo <amount>
Sets the ammo amount for the item in the player's main hand.

**Usage:**
```
!setMagAmmo <amount>
```

**Permission:**
`setMagAmmo`

### !sign edit <line> [...text]
Edits a sign at the player's location.

**Usage:**
```
!sign edit <line> [...text]
```

**Permission:**


sign.edit



### !listCstEnchants [...matches]
Lists all Custom Server Tools enchantments.

**Usage:**
```
!listCstEnchants [...matches]
```

**Permission:**
`listCstEnchants`

### !listEnchants [...matches]
Lists all registered enchantments.

**Usage:**
```
!listEnchants [...matches]
```

**Permission:**
`listEnchants`

### !listPotions [...matches]
Lists all registered potions.

**Usage:**
```
!listPotions [...matches]
```

**Permission:**
`listPotions`

### !listBiomes [...matches]
Lists all registered biomes.

**Usage:**
```
!listBiomes [...matches]
```

**Permission:**
`listBiomes`

### !listEntities [...matches]
Lists all registered entities.

**Usage:**
```
!listEntities [...matches]
```

**Permission:**
`listEntities`

### !listSkills [...matches]
Lists all registered skills.

**Usage:**
```
!listSkills [...matches]
```

**Permission:**
`listSkills`

## Player Commands

### !giveMoney <amount> [...players]
Gives money to specified players.

**Usage:**
```
!giveMoney <amount> [...players]
```

**Permission:**
`giveMoney`

### !takeMoney <amount> [...players]
Takes money from specified players.

**Usage:**
```
!takeMoney <amount> [...players]
```

**Permission:**
`takeMoney`

### !giveCurrency <currency> <amount> [...players]
Gives a specified currency to players.

**Usage:**
```
!giveCurrency <currency> <amount> [...players]
```

**Permission:**
`giveCurrency`

### !takeCurrency <currency> <amount> [...players]
Takes a specified currency from players.

**Usage:**
```
!takeCurrency <currency> <amount> [...players]
```

**Permission:**
`takeCurrency`

### !giveVMoney <amount> [...players]
Gives virtual money to specified players.

**Usage:**
```
!giveVMoney <amount> [...players]
```

**Permission:**
`giveMoney`

### !giveArMoney <amount> [...players]
Gives arcade money to specified players.

**Usage:**
```
!giveArMoney <amount> [...players]
```

**Permission:**
`giveArMoney`

### !convertMoney
Converts the money in the player's hand to virtual money.

**Usage:**
```
!convertMoney
```

**Permission:**
`convertMoney`

### !inv save <name>
Saves the player's inventory with a specified name.

**Usage:**
```
!inv save <name>
```

**Permission:**


inv.save



### !inv load <name>
Loads the player's inventory with a specified name.

**Usage:**
```
!inv load <name>
```

**Permission:**


inv.load



### !inv remove <name>
Removes a saved inventory with a specified name.

**Usage:**
```
!inv remove <name>
```

**Permission:**


inv.save



### !kick <player> [...reason]
Kicks a player with a specified reason.

**Usage:**
```
!kick <player> [...reason]
```

**Permission:**


kick



### !fine give <player> <amount> [...reason]
Gives a fine to a player.

**Usage:**
```
!fine give <player> <amount> [...reason]
```

**Permission:**


fine.give



### !fine list [...matches]
Lists all fines.

**Usage:**
```
!fine list [...matches]
```

**Permission:**


fine.list



### !myFines [...matches]
Lists all fines for the player.

**Usage:**
```
!myFines [...matches]
```

**Permission:**
`myFines`

## Chat Commands

### !chat create <name>
Creates a chat channel with a specified name.

**Usage:**
```
!chat create <name>
```

**Permission:**


chat.create



### !chat remove <name>
Removes a chat channel with a specified name.

**Usage:**
```
!chat remove <name>
```

**Permission:**


chat.remove



### !chat list [...matches]
Lists all chat channels.

**Usage:**
```
!chat list [...matches]
```

**Permission:**


chat.list



### !chat setColor <name> <color>
Sets the color of a chat channel.

**Usage:**
```
!chat setColor <name> <color>
```

**Permission:**


chat.setColor



### !chat setDisplayName <name> [...displayName]
Sets the display name of a chat channel.

**Usage:**
```
!chat setDisplayName <name> [...displayName]
```

**Permission:**


chat.setDisplayName



### !chat setDesc <name> [...desc]
Sets the description of a chat channel.

**Usage:**
```
!chat setDesc <name> [...desc]
```

**Permission:**


chat.setDisplayName



### !chat join <name>
Joins a chat channel.

**Usage:**
```
!chat join <name>
```

**Permission:**


chat.join



### !chat leave <name>
Leaves a chat channel.

**Usage:**
```
!chat leave <name>
```

**Permission:**


chat.leave



## Emote Commands

### !emote list [...matches]
Lists all emotes.

**Usage:**
```
!emote list [...matches]
```

**Permission:**


emote.list



### !emote info <name>
Displays information about an emote.

**Usage:**
```
!emote info <name>
```

**Permission:**


emote.info



### !emote buy <emote> [...matches]
Buys an emote.

**Usage:**
```
!emote buy <emote> [...matches]
```

**Permission:**


emote.buy



### !emote take <emote> <player>
Takes an emote from a player.

**Usage:**
```
!emote take <emote> <player>
```

**Permission:**


emote.take



### !emote give <emote> <player>
Gives an emote to a player.

**Usage:**
```
!emote give <emote> <player>
```

**Permission:**


emote.give



### !emote setForSale <name> <forSale>
Sets an emote for sale.

**Usage:**
```
!emote setForSale <name> <forSale>
```

**Permission:**


emote.setForSale



### !emote setHidden <name> <hidden>
Sets an emote as hidden.

**Usage:**
```
!emote setHidden <name> <hidden>
```

**Permission:**


emote.setHidden



### !emote setDefault <name> <default>
Sets an emote as default.

**Usage:**
```
!emote setDefault <name> <default>
```

**Permission:**


emote.setDefault



### !emote setDesc <name> [...desc]
Sets the description of an emote.

**Usage:**
```
!emote setDesc <name> [...desc]
```

**Permission:**


emote.setDesc



### !emote setPrice <name> <price>
Sets the price of an emote.

**Usage:**
```
!emote setPrice <name> <price>
```

**Permission:**


emote.setPrice



## Gift Code Commands

### !giftcode list [...matches]
Lists all gift codes.

**Usage:**
```
!giftcode list [...matches]
```

**Permission:**


giftcode.list



### !giftcode info <name>
Displays information about a gift code.

**Usage:**
```
!giftcode info <name>
```

**Permission:**


giftcode.info



### !giftcode create <name> [code]
Creates a gift code.

**Usage:**
```
!giftcode create <name> [code]
```

**Permission:**


giftcode.create



### !giftcode setCode <name> [code]
Sets the code for a gift code.

**Usage:**
```
!giftcode setCode <name> [code]
```

**Permission:**


giftcode.create



### !giftcode setMaxUses <name> <uses>
Sets the maximum uses for a gift code.

**Usage:**
```
!giftcode setMaxUses <name> <uses>
```

**Permission:**


giftcode.create



### !giftcode addItem <name>
Adds an item to a gift code.

**Usage:**
```
!giftcode addItem <name>
```

**Permission:**


giftcode.create



### !giftcode removeItem <name> <id>
Removes an item from a gift code.

**Usage:**
```
!giftcode removeItem <name> <id>
```

**Permission:**


giftcode.create



### !giftcode setMoney <name> <amount>
Sets the money for a gift code.

**Usage:**
```
!giftcode setMoney <name> <amount>
```

**Permission:**


giftcode.create



### !giftcode addEmote <name> <emote>
Adds an emote to a gift code.

**Usage:**
```
!giftcode addEmote <name> <emote>
```

**Permission:**


giftcode.create



### !giftcode removeEmote <name> <id>
Removes an emote from a gift code.

**Usage:**
```
!giftcode removeEmote <name> <id>
```

**Permission:**


giftcode.create



### !giftcode redeem <code>
Redeems a gift code.

**Usage:**
```
!giftcode redeem <code>
```

**Permission:**


giftcode.redeem



### !giftcode unredeem <name> <player>
Unredeems a gift code for a player.

**Usage:**
```
!giftcode unredeem <name> <player>
```

**Permission:**


giftcode.create



### !giftcode remove <name>
Removes a gift code.

**Usage:**
```
!giftcode remove <name>
```

**Permission:**


giftcode.create


## Job Commands

### !jobs create <name> [...display_name]
Creates a job with a specified name and display name.

**Usage:**
```
!jobs create <name> [...display_name]
```

**Permission:**


jobs.create



### !jobs remove <name>
Removes a job with a specified name.

**Usage:**
```
!jobs remove <name>
```

**Permission:**


jobs.add



### !jobs setPay <name> <amount>
Sets the pay for a job.

**Usage:**
```
!jobs setPay <name> <amount>
```

**Permission:**


jobs.setPay



### !jobs setPayTime <name> <time>
Sets the pay time for a job.

**Usage:**
```
!jobs setPayTime <name> <time>
```

**Permission:**


jobs.setPayTime



### !jobs setOpen <name> <open>
Sets whether a job is open.

**Usage:**
```
!jobs setOpen <name> <open>
```

**Permission:**


jobs.setOpen



### !jobs setDisplayName <name> <...display_name>
Sets the display name for a job.

**Usage:**
```
!jobs setDisplayName <name> <...display_name>
```

**Permission:**


jobs.setDisplayName



### !jobs list [...matches]
Lists all jobs.

**Usage:**
```
!jobs list [...matches]
```

**Permission:**


jobs.list



### !jobs info <name>
Displays information about a job.

**Usage:**
```
!jobs info <name>
```

**Permission:**


jobs.info



### !jobs playerList <name>
Lists all players in a job.

**Usage:**
```
!jobs playerList <name>
```

**Permission:**


jobs.playerList



### !jobs addPlayers <name> <...player_names>
Adds players to a job.

**Usage:**
```
!jobs addPlayers <name> <...player_names>
```

**Permission:**


jobs.addPlayers



### !jobs setPlaces <name> <amount>
Sets the maximum number of players for a job.

**Usage:**
```
!jobs setPlaces <name> <amount>
```

**Permission:**


jobs.setPlaces



### !jobs setFireTime <name> <time>
Sets the fire time for a job.

**Usage:**
```
!jobs setFireTime <name> <time>
```

**Permission:**


jobs.setFireTime



### !jobs removePlayers <name> <...players>
Removes players from a job.

**Usage:**
```
!jobs removePlayers <name> <...players>
```

**Permission:**


jobs.removePlayers



### !jobs reload
Reloads all jobs.

**Usage:**
```
!jobs reload
```

**Permission:**


jobs.reload


## Permission Commands

### !perms addTeams <permission_id> <...teams>
Adds teams to a permission.

**Usage:**
```
!perms addTeams <permission_id> <...teams>
```

**Permission:**
`perms.addTeams`

### !perms removeTeams <permission_id> <...teams>
Removes teams from a permission.

**Usage:**
```
!perms removeTeams <permission_id> <...teams>
```

**Permission:**
`perms.removeTeams`

### !perms addPlayers <permission_id> <...players>
Adds players to a permission.

**Usage:**
```
!perms addPlayers <permission_id> <...players>
```

**Permission:**
`perms.addPlayers`

### !perms removePlayers <permission_id> <...players>
Removes players from a permission.

**Usage:**
```
!perms removePlayers <permission_id> <...players>
```

**Permission:**
`perms.removePlayers`

## Warp Commands

### !warps
Lists all warps.

**Usage:**
```
!warps
```

**Permission:**


warp.list



### !warp set <name>
Sets a warp with a specified name.

**Usage:**
```
!warp set <name>
```

**Permission:**


warp.set



## Redeem Commands

### !redeem [code]
Redeems a code.

**Usage:**
```
!redeem [code]
```

**Permission:**


redeem



## Lottery Commands

### !genLot <min> <max> [amount]
Generates a lot with a specified min and max amount.

**Usage:**
```
!genLot <min> <max> [amount]
```

**Permission:**
`genLot`

## Debug Commands

### !debug [...matches]
Debugs and lists sample items.

**Usage:**
```
!debug [...matches]
```

**Permission:**
`debug`