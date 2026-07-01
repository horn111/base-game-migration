import { createAttributionIntent } from "./attribution";
import { getCatalogItem } from "./catalog";
import type { CreateOrderInput, GameOrder } from "./types";

export function createOrder(input: CreateOrderInput): GameOrder {
  const now = input.now ?? new Date();
  const item = getCatalogItem(input.catalog, input.catalogItemId);

  return {
    id: input.id ?? `order_${now.getTime().toString(36)}`,
    playerId: input.playerId,
    catalogItemId: item.id,
    itemTitle: item.title,
    price: item.price,
    grant: item.grant,
    status: "pending",
    attribution: createAttributionIntent(input.attribution),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
