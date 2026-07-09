function normalizeItem(item) {
  return {
    id: item.id,
    menuItemId: item.menuItemId,
    name: item.name,
    price: item.price,
    quantity: item.quantity || 0,
    instructions: item.instructions || [],
  };
}

function buildModificationChanges(originalItems = [], proposedItems = []) {
  const byId = new Map(
    (originalItems || []).map((item) => [item.menuItemId, normalizeItem(item)]),
  );
  const proposedMap = new Map(
    (proposedItems || []).map((item) => [item.menuItemId, normalizeItem(item)]),
  );
  const changes = [];

  const allKeys = new Set([...byId.keys(), ...proposedMap.keys()]);

  for (const menuItemId of allKeys) {
    const originalItem = byId.get(menuItemId);
    const proposedItem = proposedMap.get(menuItemId);
    const originalQuantity = originalItem?.quantity || 0;
    const proposedQuantity = proposedItem?.quantity || 0;

    if (originalQuantity === proposedQuantity) continue;

    const name = proposedItem?.name || originalItem?.name || "Item";

    if (originalQuantity === 0) {
      changes.push({ name, from: 0, to: proposedQuantity, type: "added" });
    } else if (proposedQuantity === 0) {
      changes.push({ name, from: originalQuantity, to: 0, type: "removed" });
    } else {
      changes.push({
        name,
        from: originalQuantity,
        to: proposedQuantity,
        type: "updated",
      });
    }
  }

  return changes;
}

function formatModificationChanges(originalItems = [], proposedItems = []) {
  return buildModificationChanges(originalItems, proposedItems).map(
    (change) => {
      const from = change.from === 0 ? "0" : `${change.from}`;
      const to = change.to === 0 ? "0" : `${change.to}`;
      return `${change.name}: ${from} → ${to}`;
    },
  );
}

function getNewlyAddedItems(originalItems = [], proposedItems = []) {
  const byId = new Map(
    (originalItems || []).map((item) => [item.menuItemId, normalizeItem(item)]),
  );
  const proposedMap = new Map(
    (proposedItems || []).map((item) => [item.menuItemId, normalizeItem(item)]),
  );
  const newItems = [];
  const allKeys = new Set([...byId.keys(), ...proposedMap.keys()]);

  for (const menuItemId of allKeys) {
    const originalItem = byId.get(menuItemId);
    const proposedItem = proposedMap.get(menuItemId);
    const originalQuantity = originalItem?.quantity || 0;
    const proposedQuantity = proposedItem?.quantity || 0;
    const addedQuantity = proposedQuantity - originalQuantity;

    if (addedQuantity > 0) {
      newItems.push({
        name: proposedItem?.name || originalItem?.name || "Item",
        quantity: addedQuantity,
      });
    }
  }

  return newItems;
}

function sanitizeForFirestore(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeForFirestore(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, nestedValue]) => {
      const sanitizedValue = sanitizeForFirestore(nestedValue);
      if (sanitizedValue !== undefined) {
        acc[key] = sanitizedValue;
      }
      return acc;
    }, {});
  }

  return value;
}

function getModifiedItems(originalItems = [], proposedItems = []) {
  const byId = new Map(
    (originalItems || []).map((item) => [item.menuItemId, normalizeItem(item)]),
  );
  const proposedMap = new Map(
    (proposedItems || []).map((item) => [item.menuItemId, normalizeItem(item)]),
  );
  const modifiedItems = [];
  const allKeys = new Set([...byId.keys(), ...proposedMap.keys()]);

  for (const menuItemId of allKeys) {
    const originalItem = byId.get(menuItemId);
    const proposedItem = proposedMap.get(menuItemId);
    const originalQuantity = originalItem?.quantity || 0;
    const proposedQuantity = proposedItem?.quantity || 0;

    if (originalQuantity === proposedQuantity) continue;

    modifiedItems.push({
      id: proposedItem?.id || originalItem?.id || `${menuItemId}-modified`,
      menuItemId,
      name: proposedItem?.name || originalItem?.name || "Item",
      price: proposedItem?.price || originalItem?.price || 0,
      quantity: proposedQuantity,
      instructions: proposedItem?.instructions || [],
    });
  }

  return modifiedItems;
}

module.exports = {
  buildModificationChanges,
  formatModificationChanges,
  getNewlyAddedItems,
  getModifiedItems,
  sanitizeForFirestore,
};
