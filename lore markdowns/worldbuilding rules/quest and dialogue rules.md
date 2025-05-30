## 📜 **Gramados Quest & Dialogue Writing Rules**

### 🧭 QUESTS

Each quest must include:

1. **Quest Name**
   A short, evocative title.

2. **Quest Log (Objective Text)**

   * Written in **first-person**, as if the player is thinking or narrating.
   * Should clearly explain **what the player must do**.
   * May reference in-world concepts or locations, but must remain clear and accessible.

3. **Completion Text**

   * Also written in **first-person**.
   * Should feel reflective, concluding, or emotional — depending on the tone of the quest.
   * For **“give item” quests**, the completion text comes **before** the resulting dialogue.
   * For **“dialogue” quests**, the completion text comes **after** the final page of dialogue.

4. **Multi-Step Quests**

   * Should be **broken into distinct mini-quests** (e.g., “Travel”, “Talk”, “Retrieve”, “Fix”, “Kill”).
   * Avoid merging too many actions into a single quest.

5. **Questlines**

   * A questline is a series of connected quests with narrative and gameplay continuity.
   * Each step should logically follow the last.
   * Must **start via a dialogue**, not via an objective popup.

---

### 🗣️ DIALOGUES

Each dialogue must:

1. Be organized into **named pages**, each with:

   * A **Page Title** (a unique name for each).
   * A **Text** field (what the NPC says).
   * A **Player Input** (usually one linear response, in some cases 2–6 when logical).

2. Use **consistent formatting**:

    ```markdown
        # **NPC: Name**

        ## Part X

        ### Page - Page Title

        **Text**:
        ```
        "NPC dialogue goes here."
        ```

        **Player Input**: (up to 6 options)
        -  "Player response goes here."
        -  "Another player response."
    ```

3. Include a **default dialogue** after a questline is completed.

   * This **“aftermath”** dialogue replaces the quest dialogue once everything is done.
   * Prevents confusion for players revisiting the NPC.

4. Support **quest start pages** and **locked pages**:

   * Pages can **trigger quests**.
   * Pages can be **locked behind quest completions or previous dialogue pages**.

5. May be used for **invisible NPCs** to simulate signs or plaques.

---

### ✅ REPEATABLE QUESTS

* Must have a **short, clear loop**.
* Clearly indicate it can be done again (e.g., “Let me know if you want to help again”).
* The dialogue after turn-in should feel **open-ended**, not conclusive.

---

### 🔧 TECHNICAL & WRITING STYLE

* Use **clear formatting** and **headings** for readability.
* Maintain **first-person tone** for player text in quests.
* Use **in-universe language and tone** but avoid excessive lore in quest objectives.
* Quests and dialogues must reference **existing world details and logic** (e.g., locations, lore, NPC knowledge).
* **No invented mechanics** unless agreed upon beforehand.
