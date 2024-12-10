import { TokenActionHud } from 'token-action-hud-core';

class ActionHandlerRQG extends TokenActionHud.ActionHandler {
  async buildSystemActions() {
    if (!this.actor) return;
    this._buildActorActions();
    this._buildCharacteristics();
    this._buildSkills();
    this._buildWeapons();
    this._buildPassions();
    this._buildRunes();
    this._buildRuneSpells();
    this._buildSpiritMagic();
  }

  _buildActorActions() {
    const actorCategory = this.initializeEmptyCategory('actor', 'Actor');
    const actionId = 'openSheet';
    actorCategory.actions.push({
      name: 'Open Sheet',
      id: actionId,
      encodedValue: ['actor', actionId].join(this.delimiter)
    });
    this.addCategory(actorCategory);
  }

  _buildCharacteristics() {
    const characteristics = this.actor.system?.characteristics;
    if (!characteristics) return;

    const attributesCategory = this.initializeEmptyCategory('attributes', 'Attributes');
    for (const [key, data] of Object.entries(characteristics)) {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      const actionId = `attribute_${key}`;
      attributesCategory.actions.push({
        name: `${label} (${data.value})`,
        id: actionId,
        encodedValue: ['attribute', actionId].join(this.delimiter)
      });
    }
    this.addCategory(attributesCategory);
  }

  _buildSkills() {
    // Skills are items of type "skill"
    const skillItems = this.actor.items.filter(i => i.type === 'skill');
    if (skillItems.length === 0) return;
    
    const skillsCategory = this.initializeEmptyCategory('skills', 'Skills');
    for (const skill of skillItems) {
      const base = skill.system.baseChance ?? 0;
      const gained = skill.system.gainedChance ?? 0;
      const total = base + gained;
      const name = skill.system.skillName || skill.name;
      const actionId = `skill_${skill.id}`;
      skillsCategory.actions.push({
        name: `${name} (${total}%)`,
        id: actionId,
        encodedValue: ['skill', actionId].join(this.delimiter)
      });
    }
    this.addCategory(skillsCategory);
  }

  _buildWeapons() {
    // Weapons are items of type "weapon"
    const weapons = this.actor.items.filter(i => i.type === 'weapon');
    if (weapons.length === 0) return;

    const weaponsCategory = this.initializeEmptyCategory('weapons', 'Weapons');
    for (const w of weapons) {
      const actionId = `weapon_${w.id}`;
      weaponsCategory.actions.push({
        name: w.name,
        id: actionId,
        encodedValue: ['weapon', w.id].join(this.delimiter)
      });
    }
    this.addCategory(weaponsCategory);
  }

  _buildPassions() {
    // Passions are items of type "passion"
    const passions = this.actor.items.filter(i => i.type === 'passion');
    if (passions.length === 0) return;

    const passionsCategory = this.initializeEmptyCategory('passions', 'Passions');
    for (const p of passions) {
      const actionId = `passion_${p.id}`;
      passionsCategory.actions.push({
        name: p.name,
        id: actionId,
        encodedValue: ['passion', p.id].join(this.delimiter)
      });
    }
    this.addCategory(passionsCategory);
  }

  _buildRunes() {
    // Runes are items of type "rune"
    const runes = this.actor.items.filter(i => i.type === 'rune');
    if (runes.length === 0) return;

    const runesCategory = this.initializeEmptyCategory('runes', 'Runes');
    for (const r of runes) {
      const actionId = `rune_${r.id}`;
      runesCategory.actions.push({
        name: r.name,
        id: actionId,
        encodedValue: ['rune', r.id].join(this.delimiter)
      });
    }
    this.addCategory(runesCategory);
  }

  _buildRuneSpells() {
    // Rune spells are items of type "runeSpell" (check correct item type)
    const runeSpells = this.actor.items.filter(i => i.type === 'runeSpell');
    if (runeSpells.length === 0) return;

    const runeSpellCategory = this.initializeEmptyCategory('runeSpells', 'Rune Spells');
    for (const rs of runeSpells) {
      const actionId = `runeSpell_${rs.id}`;
      runeSpellCategory.actions.push({
        name: rs.name,
        id: actionId,
        encodedValue: ['runeSpell', rs.id].join(this.delimiter)
      });
    }
    this.addCategory(runeSpellCategory);
  }

  _buildSpiritMagic() {
    // Spirit magic might be items of type "spiritMagic" or similar - adjust if needed
    const spiritMagic = this.actor.items.filter(i => i.type === 'spiritMagic');
    if (spiritMagic.length === 0) return;

    const spiritMagicCategory = this.initializeEmptyCategory('spiritMagic', 'Spirit Magic');
    for (const sm of spiritMagic) {
      const actionId = `spiritMagic_${sm.id}`;
      spiritMagicCategory.actions.push({
        name: sm.name,
        id: actionId,
        encodedValue: ['spiritMagic', sm.id].join(this.delimiter)
      });
    }
    this.addCategory(spiritMagicCategory);
  }
}

class RollHandlerRQG extends TokenActionHud.RollHandler {
  async doHandleActionEvent(event, encodedValue) {
    const [actionType, actionId] = encodedValue.split(this.delimiter);

    switch (actionType) {
      case 'actor':
        return this.openActorSheet(actionId);
      case 'attribute':
        return this.rollAttribute(actionId);
      case 'skill':
        return this.rollSkill(actionId);
      case 'weapon':
        return this.rollWeapon(actionId);
      case 'passion':
        return this.rollPassion(actionId);
      case 'rune':
        return this.rollRune(actionId);
      case 'runeSpell':
        return this.rollRuneSpell(actionId);
      case 'spiritMagic':
        return this.rollSpiritMagic(actionId);
    }
  }

  async openActorSheet(actionId) {
    if (actionId === 'openSheet') {
      // Toggle the actor sheet
      Hotbar.toggleDocumentSheet(this.actor.uuid);
    }
  }

  async rollAttribute(actionId) {
    const key = actionId.replace('attribute_', '');
    const characteristic = this.actor.system?.characteristics?.[key];
    if (!characteristic) return;
    const value = characteristic.value ?? 0;

    // Manual roll
    const roll = await new Roll('1d100').evaluate({async: true});
    const result = roll.total;
    const success = result <= value ? "Success" : "Failure";
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      flavor: `${key.charAt(0).toUpperCase() + key.slice(1)} check (${value}) - ${success}`
    });
  }

  async rollSkill(actionId) {
    const skillId = actionId.replace('skill_', '');
    const skill = this.actor.items.get(skillId);
    if (!skill) return;

    const itemUuid = `${this.actor.uuid}.Item.${skill.id}`;
    const item = await fromUuid(itemUuid);
    if (item?.toChat) {
      return item.toChat();
    }
  }

  async rollWeapon(actionId) {
    const weaponId = actionId.replace('weapon_', '');
    const weapon = this.actor.items.get(weaponId);
    if (!weapon) return;

    const itemUuid = `${this.actor.uuid}.Item.${weapon.id}`;
    const item = await fromUuid(itemUuid);
    if (item?.toChat) {
      return item.toChat();
    }
  }

  async rollPassion(actionId) {
    const passionId = actionId.replace('passion_', '');
    const passion = this.actor.items.get(passionId);
    if (!passion) return;

    const itemUuid = `${this.actor.uuid}.Item.${passion.id}`;
    const item = await fromUuid(itemUuid);
    if (item?.toChat) {
      return item.toChat();
    }
  }

  async rollRune(actionId) {
    const runeId = actionId.replace('rune_', '');
    const rune = this.actor.items.get(runeId);
    if (!rune) return;

    const itemUuid = `${this.actor.uuid}.Item.${rune.id}`;
    const item = await fromUuid(itemUuid);
    if (item?.toChat) {
      return item.toChat();
    }
  }

  async rollRuneSpell(actionId) {
    const runeSpellId = actionId.replace('runeSpell_', '');
    const runeSpell = this.actor.items.get(runeSpellId);
    if (!runeSpell) return;

    const itemUuid = `${this.actor.uuid}.Item.${runeSpell.id}`;
    const item = await fromUuid(itemUuid);
    if (item?.toChat) {
      return item.toChat();
    }
  }

  async rollSpiritMagic(actionId) {
    const spiritMagicId = actionId.replace('spiritMagic_', '');
    const spiritMagic = this.actor.items.get(spiritMagicId);
    if (!spiritMagic) return;

    const itemUuid = `${this.actor.uuid}.Item.${spiritMagic.id}`;
    const item = await fromUuid(itemUuid);
    if (item?.toChat) {
      return item.toChat();
    }
  }
}

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  coreModule.api.registerSystem({
    systemName: 'rqg',
    actionsHandler: ActionHandlerRQG,
    rollHandler: RollHandlerRQG
  });
});
