// attempt to spawn a MTS vehicle with NBT

//get api
var api = Java.type('noppes.npcs.api.NpcAPI').Instance();

function interact(event) {
    var player = event.player;
    var world = player.world;

    event.player.message("Interacting");

    var NBT = api.stringToNbt("{variables1:\"FRSuspension\",RRSuspension:0.024040082469582558d,variables2:\"damage\",variables0:\"RRSuspension\",variables5:\"FLSuspension\",variables6:\"door_l\",motiony:-3.6905206988688266E-4d,variables3:\"RLSuspension\",variables4:\"p_brake\",Invulnerable:0b,entityid:\"EntityVehicleF_Physics\",radio:{volume:10,currentURL:\"\"},FallDistance:0.0f,systemName:\"pegasus\",ForgeCaps:{},id:\"mts:mts_entity\",FRSuspension:0.022465460002422333d,fuelTank:{currentFluid:\"\"},Air:300s,positionx:2139.52742601081d,positiony:90.01677161100432d,part_22:{packID:\"syndicatemotorfoundry\",systemName:\"kit_stormwalker\",spawnedDefaultParts:1b,subName:\"_gramados\"},positionz:3740.428018197344d,Pos:[2139.52742601081d,90.01677161100432d,3740.428018197344d],anglesz:-0.9812835870071452d,spawnedDefaultParts:1b,anglesy:157.44018154349547d,anglesx:14.109673020926214d,part_7:{packID:\"iv_tpp\",systemName:\"trin_seat_2\",spawnedDefaultParts:1b,subName:\"_gray\"},damage:1.0d,part_6:{packID:\"iv_tpp\",systemName:\"trin_seat_2\",spawnedDefaultParts:1b,subName:\"_gray\"},part_5:{packID:\"iv_tpp\",systemName:\"trin_seat_2\",spawnedDefaultParts:1b,subName:\"_gray\"},part_4:{packID:\"iv_tpp\",systemName:\"trin_seat_2\",spawnedDefaultParts:1b,subName:\"_gray\"},serverDeltaRx:14.1092052106524d,PortalCooldown:0,part_15:{packID:\"syndicatemotorfoundry\",temp:24.02628326415945d,systemName:\"engine_oppressor\",spawnedDefaultParts:1b,subName:\"\"},part_3:{packID:\"iv_tpp\",systemName:\"wheel_classic_4d16\",spawnedDefaultParts:1b,subName:\"_0_steel\"},part_2:{packID:\"iv_tpp\",systemName:\"wheel_classic_4d16\",spawnedDefaultParts:1b,subName:\"_0_steel\"},FLSuspension:0.024040082469582558d,part_1:{packID:\"iv_tpp\",systemName:\"wheel_classic_4d16\",spawnedDefaultParts:1b,subName:\"_0_steel\"},serverDeltaRy:-0.1823930094298163d,part_0:{packID:\"iv_tpp\",systemName:\"wheel_classic_4d16\",spawnedDefaultParts:1b,subName:\"_0_steel\"},serverDeltaRz:-1.932959939614979d,packID:\"syndicatemotorfoundry\",serverDeltaMz:-0.07988175959988064d,serverDeltaMx:0.028673298818276988d,serverDeltaMy:-0.6689610352365138d,RLSuspension:0.022465460002422333d,Motion:[0.0d,0.0d,0.0d],OnGround:0b,Dimension:0,p_brake:1.0d,Rotation:[0.0f,0.0f],UpdateBlocked:0b,electricPower:12.0d,door_l:1.0d,variablescount:7,selectedBeaconName:\"\",subName:\"gramados\",Fire:-1s}")
    event.player.message("NBT: " + NBT.toJsonString());

    //change position
    NBT.setDouble("positionx", player.posX);
    NBT.setDouble("positiony", player.posY);
    NBT.setDouble("positionz", player.posZ);



    var entity = world.createEntityFromNBT(NBT);

    event.player.message("Entity: " + entity);

    world.spawnEntity(entity);
}