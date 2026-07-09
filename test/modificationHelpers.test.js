/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("assert");
const test = require("node:test");
const {
  buildModificationChanges,
  formatModificationChanges,
  getNewlyAddedItems,
  getModifiedItems,
  sanitizeForFirestore,
} = require("../src/lib/modificationHelpers.js");

test("buildModificationChanges reports quantity changes and removals", () => {
  const originalItems = [
    { menuItemId: "pizza", name: "Pizza", quantity: 2 },
    { menuItemId: "coke", name: "Coke", quantity: 1 },
  ];
  const proposedItems = [
    { menuItemId: "pizza", name: "Pizza", quantity: 1 },
    { menuItemId: "tea", name: "Tea", quantity: 1 },
  ];

  const changes = buildModificationChanges(originalItems, proposedItems);

  assert.deepStrictEqual(changes, [
    { name: "Pizza", from: 2, to: 1, type: "updated" },
    { name: "Coke", from: 1, to: 0, type: "removed" },
    { name: "Tea", from: 0, to: 1, type: "added" },
  ]);
});

test("formatModificationChanges present human-readable summaries", () => {
  const summaries = formatModificationChanges(
    [{ menuItemId: "pizza", name: "Pizza", quantity: 2 }],
    [{ menuItemId: "pizza", name: "Pizza", quantity: 1 }],
  );

  assert.deepStrictEqual(summaries, ["Pizza: 2 → 1"]);
});

test("getNewlyAddedItems returns only the quantity increase as new items", () => {
  const originalItems = [{ menuItemId: "pizza", name: "Pizza", quantity: 2 }];
  const proposedItems = [{ menuItemId: "pizza", name: "Pizza", quantity: 5 }];

  assert.deepStrictEqual(getNewlyAddedItems(originalItems, proposedItems), [
    { name: "Pizza", quantity: 3 },
  ]);
});

test("sanitizeForFirestore removes undefined values from nested payloads", () => {
  const payload = {
    items: [
      {
        id: "1",
        menuItemId: "pizza",
        name: "Pizza",
        quantity: 2,
        instructions: undefined,
      },
    ],
    summary: ["added", undefined],
    nested: { foo: undefined, bar: true },
  };

  assert.deepStrictEqual(sanitizeForFirestore(payload), {
    items: [{ id: "1", menuItemId: "pizza", name: "Pizza", quantity: 2 }],
    summary: ["added"],
    nested: { bar: true },
  });
});

test("getModifiedItems only returns items whose quantities changed", () => {
  const originalItems = [
    { menuItemId: "pizza", name: "Pizza", quantity: 2 },
    { menuItemId: "coke", name: "Coke", quantity: 1 },
  ];
  const proposedItems = [
    { menuItemId: "pizza", name: "Pizza", quantity: 5 },
    { menuItemId: "coke", name: "Coke", quantity: 1 },
  ];

  assert.deepStrictEqual(getModifiedItems(originalItems, proposedItems), [
    {
      id: "pizza-modified",
      menuItemId: "pizza",
      name: "Pizza",
      price: 0,
      quantity: 5,
      instructions: [],
    },
  ]);
});
