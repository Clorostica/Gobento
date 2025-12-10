export const up = (pgm) => {
  pgm.addColumn("task_list", {
    liked: {
      type: "boolean",
      default: false,
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("task_list", "liked");
};

