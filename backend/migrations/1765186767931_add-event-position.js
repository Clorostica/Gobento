export const up = (pgm) => {
  pgm.addColumn("task_list", {
    position: {
      type: "integer",
      notNull: false,
      default: 0,
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("task_list", "position");
};
