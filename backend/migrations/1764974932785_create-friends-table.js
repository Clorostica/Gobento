export const up = (pgm) => {
  pgm.dropTable("friendships");

  pgm.createTable("friends", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "text",
      notNull: true,
      references: "users",
      onDelete: "cascade",
    },
    friend_user_id: {
      type: "text",
      notNull: true,
      references: "users",
      onDelete: "cascade",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

export const down = (pgm) => {
  pgm.dropTable("friends");

  pgm.createTable("friendships", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id_1: {
      type: "text",
      notNull: true,
      references: "users",
      onDelete: "cascade",
    },
    user_id_2: {
      type: "text",
      notNull: true,
      references: "users",
      onDelete: "cascade",
    },
    status: {
      type: "text",
      notNull: true,
      default: "accepted", // 'pending' or 'accepted'
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Create unique constraint to prevent duplicate friendships
  pgm.addConstraint("friendships", "unique_friendship", {
    unique: ["user_id_1", "user_id_2"],
  });

  // Create index for faster queries
  pgm.createIndex("friendships", ["user_id_1", "user_id_2"]);
  pgm.createIndex("friendships", ["status"]);
};
