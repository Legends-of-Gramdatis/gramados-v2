load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_volatile_loot_pools.js');

registerXCommands([
    ['!loottableVLP add <alias> <weight>', function (pl, args, data) {
        var mainhand = pl.getMainhandItem();

        if (!mainhand || mainhand.isEmpty()) {
            tellPlayer(pl, '&c:cross: Hold the item to add in your main hand.');
            return false;
        }

        var submittedItem = mainhand.copy();
        var result = addItemStackToVolatileLootPool(
            args.alias,
            submittedItem,
            args.weight
        );

        if (!result.Success) {
            switch (result.Reason) {
                case 'unknown_alias':
                    tellPlayer(pl, '&c:cross: Unknown volatile loot pool alias: &e' + args.alias + '&c.');
                    break;
                case 'invalid_weight':
                    tellPlayer(pl, '&c:cross: Loot-table weight must be greater than 0.');
                    break;
                case 'not_whitelisted':
                    tellPlayer(pl, '&c:cross: This item is not allowed in volatile loot pool &e' + result.Alias + '&c.');
                    break;
                case 'invalid_whitelist':
                    tellPlayer(pl, '&c:cross: Volatile loot pool &e' + result.Alias + '&c has an invalid whitelist configuration.');
                    break;
                case 'write_failed':
                    tellPlayer(pl, '&c:cross: Failed to add the item to volatile loot pool &e' + result.Alias + '&c. The item was not consumed.');
                    break;
                default:
                    tellPlayer(pl, '&c:cross: Failed to add the item to the volatile loot pool. The item was not consumed.');
                    break;
            }

            return false;
        }

        // Consume exactly one item only after the loot-table write succeeded.
        var remaining = mainhand.getStackSize() - 1;

        if (remaining <= 0) {
            pl.setMainhandItem(pl.getWorld().createItem('minecraft:air', 0, 1));
        } else {
            var remainingStack = mainhand.copy();
            remainingStack.setStackSize(remaining);
            pl.setMainhandItem(remainingStack);
        }

        var itemName = stripColors(submittedItem.getDisplayName());

        tellPlayer(
            pl,
            '&a:check_mark: Added &e' + submittedItem.getDisplayName() +
            '&a to volatile loot pool &e' + result.Alias +
            '&a with weight &e' + args.weight + '&a.'
        );

        logToFile(
            'loot_tables',
            '[VLP] ' + pl.getName() + " added '" + itemName +
            "' to '" + result.Alias + "' (weight " + args.weight + ').'
        );

        return true;
    }, 'loottableVLP.add', [
        {
            'argname': 'alias',
            'type': 'string'
        },
        {
            'argname': 'weight',
            'type': 'number',
            'min': 0.000001
        }
    ]]
]);
