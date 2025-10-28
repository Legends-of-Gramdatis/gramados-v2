Separators and logging throughout the 10h onboarding

# Color conventions

## General
- waiting repeats: &e
- waiting repeats highlights: &6
- phase starts: &b:sun:
- phase starts highlight: &6&l
- phase completions: &b
- stage completion messages: &a


## Phase 0
- phase separator: &6
- phase titles: &e

## Phase 1
- phase separator: &b
- phase titles: &e

## Phase 2
- phase separator: &2
- phase titles: &a


---

# 0 Phase 0 - Gramados Arrival

## 0.1 Stage 1 - Initial welcome (one step)

**Start**  
&6[===] &eGramados Arrival &6[===]  
&b:sun: Welcome to Gramados! Please speak with &6&l{npc} &r&bto complete your arrival paperwork.  

**Repeat reminder**  
:lit:&e You still need to speak with {npc} &r&eto continue your arrival process.  

**Exiting confinement**  
:lit:&e You still need to speak with {npc} &r&eto finish arrival before leaving.  

**Completion**  
:giftchest: {npc} &ahas provided you with a new bicycle and a wrench as your first vehicle!  

## 0.2 Stage 2 -  Granted transport and transfer (one step)

**Start**  
&6[===] &eState Hotel Transfer &6[===]  
&a:check_mark: Paperwork ongoing! Please wait &6{delay}s&a while {npc} &earranges your transfer to the State Hotel.  

**Repeat reminder**  
N/A  

**Exiting confinement**  
:lit:&e Please wait inside the arrival area until your transfer is complete.

**Completion**  
N/A  

## Phase 0 Completion
:airplane_departure:&b Welcome to Gramados! Enjoy your stay at the State Hotel.
&6[===]

# 1 Phase 1 - State Hotel Room and Home

## 1.1 Stage 1 - Finding Room

### 1.1.1 Step 1 - Looking for the room

**Start**  
&b[===] &eState Room Assignment &b[===]  
&b:sun: Welcome to the State Hotel! You have been assigned to room &e{room}&b. Please make your way there to settle in.  

**Repeat reminder**  
:lit: &eFind your assigned room &6{room}&e and enter it.  

**Exiting confinement**  
:door:&e Please stay inside the State Hotel until you find your room &6{room}&e. 

**Completion**  
:key: &aWelcome! This is your room &6{room}&a. We'll issue some starter furniture in &6{delay}s&a.  

### 1.1.2 Step 2 - Initial setup  

**Start**  
N/A  

**Repeat reminder**  
N/A  

**Exiting confinement**  
:door: &ePlease stay inside your room &6{room}&e while we prepare your starter furniture.  

**Completion**  
:giftchest: &aYou have been granted some new furniture for your room! you can make the space yours by arranging it as you like.  

## 1.2 Stage 2 - Getting familiar with commands

### 1.2.1 Step 1 - Setting home

**Start**  
&b[===] &eHome Registration &b[===]
&b:sun: To register this room as your your home, please run &6!setHome <name> &bin the chat. This will allow you to return here easily later.  

**Repeat reminder**  
:lit: &eRegister this room {room} as your home with &6!setHome <name>&e.  

**Exiting confinement**  
:door: &ePlease register this room &6{room}&e as your home with &6!setHome <name>&e before leaving.

**Completion**  
&a:check_mark: You have successfully registered this room as your home! You can now use &6!home &ato teleport back here anytime. You can also run &6!myHomes &ato see all your registered homes.

## 1.3 Stage 3 - Testing the commands (!myHomes and !home)

### 1.3.1 - step 1 - Using !myHomes and !home
> **note**: This step completes when player is far enough from any of his home.

**Start**  
&b[===] &eHome Command Tutorial &b[===]
&b:sun: You have learned how to set your home. Now, try using &6!myHomes &band &6!home &bto manage your homes. Start by walking away from your room.

**Repeat reminder**  
:lit: &eOpen &6!myHomes&e, then walk a few blocks away and try &6!home &eto return.  

**Exiting confinement**  
N/A

**Completion**  
&a:check_mark: You're far enough now. Try &6!home &aor &6!home <name> &ato teleport back to your home.  

### 1.3.2 - step 2 - Returning home  
> **note**: This step starts when player is far enough from any of his home.  
> **note**: This step completes when player has ran !home and is in his home again.  

**Start**  
N/A

**Repeat reminder**  
:lit: &eYou're far enough now. Try &6!home &eor &6!home <name> &eto teleport back to your home.  

**Exiting confinement**  
N/A

**Completion**  
&a:check_mark: You successfully used &6!home &aor &6!home <name> &ato return to your home!  

## 1.4 Stage 4 - Lost Somewhere – radius confine, use !home to return

### 1.4.1 - step 1 - Getting lost
**Start**  
&b[===] &eLost Somewhere &b[===]  
&b:sun: You feel disoriented. In &6{delay}s&b, you'll be moved. Be ready to use &6!home &bor &6!home <name> &bto return home.  

**Repeat reminder**  
N/A

**Exiting confinement**  
N/A

**Completion**  
N/A

### 1.4.2 - step 2 - Using !home to return
**Start**  
&b:sun: Here we are, lost in the middle of nowhere, where only ruins remain. Use &6!home &bor &6!home <name> &bto safely return to your home.  

**Repeat reminder**  
:lit: &eTry running &6!home &eor &6!home <name> &eto safely return home.  

**Exiting confinement**  
:door: &ePlease use &6!home &eor &6!home <name> &eto return to your home quickly.  

**Completion**  
&a:check_mark: You found your way back. Feels good to be home again!  

## Phase 1 Completion
&b:sun: You can view your homes anytime with &6!myHomes&b. By default you can set up to &6{max}&b homes.  
&b[===]  

# 2 Phase 2 - Economy and Pouch

## 2.1 Stage 1 - First coins and understanding pouch

### 2.1.1 Step 1 - Your first coins  
> **note**: At start of step 1, the player is given 40g as 2 * 20g bills.  

**Start**  
&2[===] &aYour First Coins &2[===]  
&b:sun: You received &r:money:&e40g&b (2x 20g bills). Please run &6!myMoney &bto see your pouch and inventory monetary breakdown.  

**Repeat reminder**  
:lit: &eRun &6!myMoney &eto check your Money Pouch balance.  

**Exiting confinement**  
N/A

**Completion**  
&a:check_mark: You now know how to open your Money Pouch! In &6{delay}s&a, we'll guide you on how to read through it!

### 2.1.2 Step 2 - Understanding Your Pouch

**Start**  
&2[===] &aUnderstanding Your Pouch &2[===]  
&b:sun: Here's a quick overview of the main currencies you will see:  
  
&dArcade Tokens: :money: &a:check_mark: Won't drop on death.  
&7  Event tokens obtained by participating in server events.  
  
&bVote Tokens: :money: &a:check_mark: Won't drop on death.  
&7  Legacy token system for voting; currently deprecated and not supported.  
  
&2Shop Tokens: :money: &a:check_mark: Won't drop on death.  
&7  Purchased currency used for cosmetics and paid content.  
  
&eMoney Pouch: &r:money:  
&7  A dematerialized balance representing money stored in your pouch. (In grons)  
&r:danger:&c 50% of it will drop on death.  
  
&eInventory: &r:money:  
&7  Physical currency items you carry in your inventory. (In grons)  
&r:danger:&c 100% of it will drop on death.  

**Repeat reminder**  
N/A  

**Exiting confinement**  
N/A  

**Completion**  
:page_facing_up: &aA detailed currency guide has been added to your inventory.  

## 2.2 Stage 2 - Depositing money into pouch  

### 2.2.1 Step 1 - Depositing money

**Start**  
&2[===] &aDepositing Money &2[===]  
&b:sun: You can deposit money items from your inventory into your Money Pouch for safer keeping. You have to run &6!deposit &bwith money in hand to do so.  

**Repeat reminder**  
:lit: &eHold the money items in your hand and run &6!deposit &eto deposit them into your Money Pouch.  

**Exiting confinement**  
N/A  

**failure**  
:danger: &eIt looks like your inventory still contains your money. Please hold the money in your hand and run &6!deposit &ewith &6&lmoney in hand&r&e.  
:danger: &eWe didn't detect any change in your pouch yet. Please try &6!deposit &ewith money in hand.  

**Completion**  
&a:check_mark: You have successfully deposited money into your Money Pouch! Your pouch balance has increased.  

### 2.2.2 Step 2 - Check Pouch

**Start**  
&b:sun: Now that you've deposited money into your pouch, it's time to confirm the update. Please run &6!myMoney &bagain to see your updated pouch balance.  

**Repeat reminder**  
:lit: &ePlease run &6!myMoney &eagain to confirm your pouch balance.

**Exiting confinement**  
N/A  

**Completion**  
&a:check_mark: You have successfully confirmed your Money Pouch update! The rest is still WIP.


## 2.3 Stage 3 - Depositing batch of money items  

### 2.3.1 Step 1 - Depositing batch

**Start**  
&2[===] &aDepositing Batch of Money Items &2[===]  
&b:sun: What a mess. You have several money items scattered in your inventory. To deposit them all at once, you can simply run &6!depositall &b, this will deposit all money items you have in your inventory into your Money Pouch.

**Repeat reminder**  
:lit: &eRun &6!depositall &eto deposit all money items from your inventory into your Money Pouch.

**Exiting confinement**  
N/A

**Completion**  
&a:check_mark: You have successfully deposited all money items from your inventory into your Money Pouch! Your pouch balance has increased.  

## 2.4 Stage 4 - Withdrawing money from pouch

### 2.4.1 Step 1 - Check validity
> Note: This is only here at teh start of the stage to ensure player has not a single money item in inventory.  

**failure reminder**  
:danger: &ePlease empty your inventory of all money items before proceeding with next steps. Use &6!depositall &eto deposit them into your Money Pouch.  

### 2.4.2 Step 2 - Withdrawing money

**Start**  
&2[===] &aWithdrawing Money &2[===]  
&b:sun: You can withdraw money from your Money Pouch into physical money items in your inventory. To do so, run &6!withdraw 6g &bwith the desired amount to withdraw.

**Repeat reminder**  
:lit: &ePlease run &6!withdraw 6g &eto withdraw the specified amount from your Money Pouch.

**Completion**  
&a:check_mark: You have successfully withdrawn &r:money:&e6G &afrom your Money Pouch! Check your inventory, it has been updated with the physical money items. It should have a &r:money:&e5G &acoin and a &r:money:&e1G &acoin.

### 2.4.3 Step 3 - Deposit money again

**Start**  
&b:sun: Now that you've withdrawn money from your pouch, try depositing it back in. Either by holding the money items in your hand and running &6!deposit &bor by running &6!depositall &bto deposit all money items from your inventory.

**Repeat reminder**  
:lit: &ePlease run &6!deposit &eor &6!depositall &eto deposit all your money items back into your Money Pouch.

### 2.4.4 Step 4 - Withdrawing multiple items

**Start**  
&2[===] &aWithdrawing Multiple Items &2[===]  
&b:sun: Let's say you need to withdraw &66&b coins of &r:money:&e1G &a, and not just &r:money:&e6G &ain total. You can do this by running &6!withdraw 1g 6 &bto withdraw &66&b coins of &r:money:&e1G &a!  

**Repeat reminder**  
:lit: &ePlease run &6!withdraw 1g 6 &eto withdraw &66&e coins of &r:money:&e1G &efrom your Money Pouch.

**Completion**  
&a:check_mark: You have successfully withdrawn &66&e coins of &r:money:&e1G &afrom your Money Pouch! Check your inventory, it has been updated with the physical money items. It should have &66&e coins of &r:money:&e1G &a.

## 2.5 Stage 5 - Your first purchase

### 2.5.1 Step 1 - Heading to the canteen
> **note**: On completion of this step, a snapshot of your inventory will be saved.
> **note**: Completion of this step is triggered when player is detected within the canteen area.

**Start**  
&2[===] &aHeading to the Canteen &2[===]  
&b:sun: It's time to make your first purchase! Head over to the &6State Hotel canteen, floor 1&b and take a look at the traders. You will see items available for purchase along with their prices.

**Repeat reminder**  
:lit: &ePlease head over to the &6State Hotel canteen, floor 1&e to view the available items for purchase.

**Completion**  
&a:check_mark: Now that you are at the canteen, find a waiter and browse their items.

### 2.5.2 Step 2 - Finding waiter
> **note**: Completion of this step is triggered when player is detected near a waiter NPC.

**Start**  
N/A

**Repeat reminder**  
:lit: &ePlease find a waiter NPC in the canteen to view their items for purchase.

**Exiting confinement**  
:door: &ePlease stay inside the canteen area until you find a waiter NPC.

**Completion**  
N/A

### 2.5.3 Step 3 - Purchasing food
> **note**: the completion of this step is triggered by the detection of a new item available at the trader's trades in your inventory. Compared to previous snapshot.

**Start**  
&2[===] &aMaking Your First Purchase &2[===]
&b:sun: Now that you've found a waiter, it's time to make your first purchase! Choose any food item you like from their menu and buy it using your Money! Remember, use &6!myMoney &bto check your balance, &6!withdraw <amount> &bor &6!withdraw <denomination> <quantity> &bto withdraw money from your pouch.

**Repeat reminder**  
:lit: &ePlease choose a food item from the waiter's menu to purchase.

**Exiting confinement**  
:door: &ePlease stay inside the canteen area until you complete your purchase.

**Completion**  
&a:check_mark: Congratulations on making your first purchase! Enjoy your meal.

## Phase 2 Completion
&b:sun: You have completed the Economy and Pouch tutorial! You can now manage your Money Pouch and make purchases with ease.  
&2[===]

# 3 Phase 3 - WIP

# Placeholder


**Start**  
**Repeat reminder**  
**Exiting confinement**  
**failure**  
**Completion**  