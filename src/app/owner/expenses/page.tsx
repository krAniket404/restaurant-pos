"use client";

import React from "react";
import { useExpenseStore } from "../../../store/useExpenseStore";
import { Card, CardContent } from "../../../components/ui/Card";
import { Banknote, Users, ClipboardList, CalendarDays } from "lucide-react";

export default function OwnerExpensesPage() {
  const { expenses, loading } = useExpenseStore();

  const expensesByDate = expenses.reduce<Record<string, typeof expenses>>(
    (acc, expense) => {
      const dateKey = new Date(expense.createdAt).toISOString().split("T")[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(expense);
      return acc;
    },
    {},
  );

  const dateGroups = Object.entries(expensesByDate).sort(([a], [b]) =>
    b.localeCompare(a),
  );

  const formatDateLabel = (dateKey: string) =>
    new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500">
          Loading expenses...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Expenses Overview</h1>
      </div>

      {expenses.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-slate-500">
          No expenses recorded yet.
        </div>
      ) : (
        <div className="space-y-6">
          {dateGroups.map(([dateKey, dateExpenses]) => {
            const dailyTotal = dateExpenses.reduce(
              (sum, expense) => sum + expense.amount,
              0,
            );

            return (
              <section
                key={dateKey}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-slate-800">
                      {formatDateLabel(dateKey)}
                    </h2>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                    Total: ₹{dailyTotal.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-6">
                  {(["Persons", "Items"] as const).map((groupName) => {
                    const groupExpenses = dateExpenses.filter(
                      (expense) =>
                        (expense.type === "person" ? "Persons" : "Items") ===
                        groupName,
                    );

                    if (groupExpenses.length === 0) return null;

                    return (
                      <section key={groupName}>
                        <div className="mb-4 flex items-center gap-2">
                          {groupName === "Persons" ? (
                            <Users className="h-5 w-5 text-indigo-600" />
                          ) : (
                            <ClipboardList className="h-5 w-5 text-indigo-600" />
                          )}
                          <h3 className="text-lg font-semibold text-slate-700">
                            {groupName}
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {groupExpenses.map((expense) => (
                            <Card key={expense.id} className="overflow-hidden">
                              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Banknote className="h-4 w-4 text-slate-500" />
                                  <span className="font-semibold text-slate-700">
                                    {expense.name}
                                  </span>
                                </div>
                                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  {expense.type}
                                </span>
                              </div>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-slate-500">
                                    Amount
                                  </span>
                                  <span className="text-lg font-bold text-slate-800">
                                    ₹{expense.amount.toFixed(2)}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
