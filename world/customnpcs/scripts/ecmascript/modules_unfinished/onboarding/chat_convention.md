Separators and logging throughout the 10h onboarding

# Color conventions

## General
- waiting repeats: &e
- waiting repeats highlights: &6
- phase starts: &b:star:
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


---

# 0 Phase 0 - Gramados Arrival

## Stage 1 - Initial welcome (one step)

**Start**  
&6[===] &eGramados Arrival &6[===]  
&b:star: Welcome to Gramados! Please speak with &6&l{npc} &r&bto complete your arrival paperwork.  

**Repeat reminder**  
:lit:&e You still need to speak with {npc} &r&eto continue your arrival process.  

**Exiting confinement**  
:lit:&e You still need to speak with {npc} &r&eto finish arrival before leaving.  

**Completion**  
:giftchest: {npc} &ahas provided you with a new bicycle and a wrench as your first vehicle!  

## Stage 2 -  Granted transport and transfer (one step)

**Start**  
&6[===] &eState Hotel Transfer &6[===]  
&a:check_mark: Paperwork ongoing! Please wait &6{delay}s&a while {npc} &earranges your transfer to the State Hotel.  

**Repeat reminder**  
N/A  

**Exiting confinement**  
:hourglass:&e Transfer in progress. Please wait inside the office until you're transferred to the State Hotel.  

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
&b:star: Welcome to the State Hotel! You have been assigned to room &e{room}&b. Please make your way there to settle in.  

**Repeat reminder**  
:lit: &eFind your assigned room &6{room}&e and enter it.  

**Exiting confinement**  
:hourglass:&e Please stay inside the State Hotel until you find your room &6{room}&e. 

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
&b:star: To register this room as your your home, please run &e!setHome <name> &bin the chat. This will allow you to return here easily later.  

**Repeat reminder**  
:lit: &eRegister this room {room} as your home with &6!setHome <name>&e.  

**Exiting confinement**  
:door: &ePlease register this room {room} as your home with &6!setHome <name>&e before leaving.

**Completion**  
&a:check_mark: You have successfully registered this room as your home! You can now use &e!home &ato teleport back here anytime. You can also run &e!myHomes &eto see all your registered homes.

## 1.3 Stage 3 - Testing the commands (!myHomes and !home)

### 1.3.1 - step 1 - Using !myHomes and !home
> **note**: This step completes when player is far enough from any of his home.

**Start**  
&b[===] &eHome Command Tutorial &b[===]
&b:star: You have learned how to set your home. Now, try using &e!myHomes &eand &e!home &eto manage your homes. Start by walking away from your room.

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

## 1.4 Stage 4 - Lost Moment – radius confine, use !home to return

### 1.4.1 - step 1 - Getting lost
**Start**  
&b[===] &eLost Somewhere &b[===]  
&b:star: You feel disoriented. In &6{delay}s&b, you'll be moved. Be ready to use &6!home &bor &6!home <name> &bto return home.  

**Repeat reminder**  
N/A

**Exiting confinement**  
N/A

**Completion**  
N/A

### 1.4.2 - step 2 - Using !home to return
**Start**  
&b:star: Here we are, lost in the middle of nowhere, where only ruins remain. Use &6!home &bor &6!home <name> &bto safely return to your home.  

**Repeat reminder**  
:lit: &eTry running &6!home &eor &6!home <name> &eto safely return home.  

**Exiting confinement**  
:door: &ePlease use &6!home &eor &6!home <name> &eto return to your home quickly.

**Completion**  
&a:check_mark: You found your way back. Feels good to be home again!  
&b:sun: You can view your homes anytime with &6!myHomes&b. By default you can set up to &6{max}&b homes.  

# 2 Phase 2 - Economy and Pouch

## 2.1 Stage 1 - Money and pouch introduction

### 2.1.1 Step 1 - Your first coins  
> **note**: At start of step 1, the player is given 40g as 2 * 20g bills.  

**Start**  
&6[===] &eYour First Coins &6[===]  
&b:sun: You received &r:money:&e40g&b (2x 20g bills). Please run &e!myMoney &bto see your pouch and inventory monetary breakdown.  

**Repeat reminder**  
:lit: &eRun &6!myMoney &eto check your Money Pouch balance.  

**Exiting confinement**  
N/A

**Completion**  
&a:check_mark: You now know how to open your Money Pouch! In &6{delay}s&a, we'll guide you on how to read through it!

### 2.1.2 Step 2 - Understanding pouch contents

**Start**  
&6[===] &eUnderstanding Your Pouch &6[===]  
&b:sun: Here's a quick overview of the main currencies you will see:  
&dArcade Tokens: :money:&7 - Event tokens obtained by participating in server events. &a:check_mark: Won't drop on death.
&bVote Tokens: :money:&7 - Legacy token system for voting; currently deprecated and not supported. &a:check_mark: Won't drop on death.
&2Shop Tokens: :money:&7 - Purchased currency used for cosmetics and paid content. &a:check_mark: Won't drop on death.
&eMoney Pouch: &r:money:&7 - A dematerialized balance representing money stored in your pouch. (In grons) &r:danger:&c 50% of it will drop on death.
&eInventory: &r:money:&7 - Physical currency items you carry in your inventory. (In grons) &r:danger:&c 100% of it will drop on death.

**Repeat reminder** 
**Exiting confinement**  
**Completion**  




**Start**  
**Repeat reminder** 
**Exiting confinement**  
**Completion**  