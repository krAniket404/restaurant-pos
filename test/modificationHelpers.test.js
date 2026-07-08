const assert = require("assert");
const test = require("node:test");
const {
  buildModificationChanges,
  formatModificationChanges,
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
