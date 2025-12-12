export const up = (pgm) => {
  pgm.addColumn("task_list", {
    original_event_id: {
      type: "uuid",
      notNull: false,
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("task_list", "original_event_id");
};
