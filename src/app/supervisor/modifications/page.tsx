"use client";

import React from "react";
import { useOrderStore } from "../../../store/useOrderStore";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";

export default function SupervisorModificationsPage() {
  const { orders, decideModificationItem } = useOrderStore();

  const modifications = orders.filter(
    (order) =>
      (order.kind === "modification" ||
        Boolean(order.parentOrderId) ||
        Boolean(order.itemDecisions?.length)) &&
      order.status === "requested",
  );

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Modification Requests
          </h1>
          <p className="text-slate-500 mt-2">
            Approve or reject each item individually.
          </p>
        </div>
      </div>

      {modifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-dashed border-slate-300">
          <p className="text-slate-500 text-lg">
            No modification requests yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {modifications.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <div className="bg-amber-100 px-4 py-3 border-b border-amber-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">
                    Modification
                  </p>
                  <h2 className="text-xl font-bold text-slate-800">
                    Table {order.tableNumber}
                  </h2>
                </div>
                <span className="text-sm text-slate-500">
                  {new Date(order.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <CardContent className="p-4 space-y-4">
                {(order.modificationSummary || []).length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-semibold text-amber-700 mb-2">
                      Changes
                    </p>
                    <ul className="space-y-1 text-sm text-amber-800">
                      {(order.modificationSummary || []).map((entry, index) => (
                        <li key={`${entry}-${index}`}>• {entry}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-3">
                  {(order.itemDecisions || []).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {item.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            Original: {item.originalQuantity} • Proposed:{" "}
                            {item.quantity}
                          </p>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] rounded-full px-2 py-1 bg-slate-100 text-slate-600">
                          {item.decision}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button
                          className="flex-1"
                          onClick={() =>
                            decideModificationItem(
                              order.id,
                              item.id,
                              "approved",
                            )
                          }
                          disabled={item.decision !== "pending"}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          className="flex-1"
                          onClick={() =>
                            decideModificationItem(
                              order.id,
                              item.id,
                              "rejected",
                            )
                          }
                          disabled={item.decision !== "pending"}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
