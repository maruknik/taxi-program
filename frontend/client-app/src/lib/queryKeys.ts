export const queryKeys = {
  // Users
  users: {
    all: ["users"] as const,
    me: ["users", "me"] as const,
    byId: (id: string) => ["users", id] as const,
  },

  // Rides
  rides: {
    all: ["rides"] as const,
    byId: (id: string) => ["rides", id] as const,
    history: ["rides", "history"] as const,
    active: ["rides", "active"] as const,
  },

  // Drivers
  drivers: {
    all: ["drivers"] as const,
    available: (lat: number, lng: number) =>
      ["drivers", "available", lat, lng] as const,
    byId: (id: string) => ["drivers", id] as const,
  },

  // Payments
  payments: {
    all: ["payments"] as const,
    methods: ["payments", "methods"] as const,
    history: ["payments", "history"] as const,
  },
};
