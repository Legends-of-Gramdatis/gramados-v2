import crafttweaker.item.IItemStack;
import crafttweaker.item.IIngredient;
import mods.jei.JEI;
import crafttweaker.item.IItemTransformer;

//======= Configuration section =======

var allowedMods as string[] = [
	"harvestcraft"
];

var allowedItems as IItemStack[] = [
	<minecraft:milk_bucket>,
	<growthcraft_rice:rice_ball>,
	<growthcraft_bees:honey_jar>,
	<growthcraft_bees:bottlefluid_honey>
];

var disabledItems as IIngredient[] = [
	<harvestcraft:waterfilter>,
	<harvestcraft:grinder>,
	<harvestcraft:apiary>,
	<harvestcraft:honey>,
	<harvestcraft:honeycomb>,
	<harvestcraft:pressedwax>,
	<harvestcraft:waxcomb>,
	<harvestcraft:hardenedleatherhelmitem>,
	<harvestcraft:hardenedleatherchestitem>,
	<harvestcraft:hardenedleatherleggingsitem>,
	<harvestcraft:hardenedleatherbootsitem>,
	<harvestcraft:hardenedleatheritem>,
	<harvestcraft:juiceritem>,
	<harvestcraft:mixingbowlitem>,
	<harvestcraft:mortarandpestleitem>,
	<harvestcraft:bakewareitem>,
	<harvestcraft:saucepanitem>,
	<harvestcraft:skilletitem>,
	<harvestcraft:potitem>,
	<harvestcraft:cuttingboarditem>,
	<harvestcraft:fishtrapbaititem>,
	<harvestcraft:veggiebaititem>,
	<harvestcraft:grainbaititem>,
	<harvestcraft:fruitbaititem>,
	<harvestcraft:watertrap>,
	<harvestcraft:groundtrap>,
	<harvestcraft:well>,
	<harvestcraft:shippingbin>,
	<harvestcraft:market>,
	<harvestcraft:presser>
];

//Candles
recipes.removeByRegex("harvestcraft:candledeco[\\w\\d_]+");
//All saplings
recipes.removeByRegex("harvestcraft:\\w+_sapling");
//Hardened leather & armor
recipes.removeByRegex("harvestcraft:hardenedleather\\w+");
//Planks and logs
recipes.removeByRegex("forestry:\\w*planks\\w*");

//===== Configuration section end =====

for recipe in recipes.all {
	val item = recipe.output;
	var found = false;
	for aItem in allowedItems {
		if(aItem.matches(item)) {
			found = true;
			break;
		}
	}
	if(found) continue;
	
	if(!isNull(item) && !(allowedItems has item.definition.id) && !(allowedMods has item.definition.owner)) {
		print("Removing " + recipe.name + " | " + item.definition.id);
		recipes.removeByRecipeName(recipe.fullResourceDomain);
	}
}

for ingredient in disabledItems {
    recipes.remove(ingredient);
}

// Add the soapy water recipe
recipes.addShaped(<cfm:item_soap_water>, [[<cfm:item_soap>, <minecraft:water_bucket>]]);

val temp_unfiltered_honey = <forge:bucketfilled>.withTag({FluidName: "for.honey", Amount: 1000});
val unfiltered_honey = temp_unfiltered_honey.noReturn();
val filter = <growthcraft_milk:cheese_cloth>;
val keepable_filter = filter.reuse();

val brewable_honey = <forge:bucketfilled>.withTag({FluidName: "fluid_honey", Amount: 1000});

// forestry honey to growthcraft honey
recipes.addShapeless(brewable_honey, [unfiltered_honey, keepable_filter]);

