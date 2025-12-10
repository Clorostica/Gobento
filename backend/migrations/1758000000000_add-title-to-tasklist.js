export const up = (pgm) => {
  pgm.addColumn("task_list", {
    title: {
      type: "text",
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("task_list", "title");
};

