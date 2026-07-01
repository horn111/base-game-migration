import type { CatalogItem } from "./types";

export function validateCatalog(catalog: CatalogItem[]) {
  const seen = new Set<string>();

  for (const item of catalog) {
    if (!item.id) {
      throw new Error("Catalog item id is required.");
    }

    if (seen.has(item.id)) {
      throw new Error(`Duplicate catalog item id: ${item.id}.`);
    }

    if (Number(item.price.amount) <= 0) {
      throw new Error(`Catalog item ${item.id} must have a positive price.`);
    }

    if (item.price.currency !== "USDC") {
      throw new Error(`Catalog item ${item.id} must use USDC for alpha.`);
    }

    if (item.grant.amount <= 0) {
      throw new Error(`Catalog item ${item.id} must grant a positive amount.`);
    }

    seen.add(item.id);
  }
}

export function getCatalogItem(catalog: CatalogItem[], catalogItemId: string) {
  validateCatalog(catalog);

  const item = catalog.find((catalogItem) => catalogItem.id === catalogItemId);

  if (!item) {
    throw new Error(`Unknown catalog item: ${catalogItemId}.`);
  }

  return item;
}

export const alphaTicketCatalog: CatalogItem[] = [
  {
    id: "starter-ticket-pack",
    title: "Starter Ticket Pack",
    description: "Ten non-withdrawable entry tickets for alpha game sessions.",
    price: {
      amount: "2.00",
      currency: "USDC",
    },
    grant: {
      unit: "ticket",
      amount: 10,
    },
    tags: ["ticket_pack", "alpha"],
  },
  {
    id: "raid-ticket-pack",
    title: "Raid Ticket Pack",
    description: "Twenty-five tickets for heavier playtesting and live-ops demos.",
    price: {
      amount: "4.50",
      currency: "USDC",
    },
    grant: {
      unit: "ticket",
      amount: 25,
    },
    tags: ["ticket_pack", "liveops"],
  },
];
