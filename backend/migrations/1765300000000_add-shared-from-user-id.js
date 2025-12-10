export const up = (pgm) => {
  pgm.addColumn("task_list", {
    shared_from_user_id: {
      type: "text",
      notNull: false,
      references: "users",
      onDelete: "set null",
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("task_list", "shared_from_user_id");
};

