export const up = (pgm) => {
  pgm.addColumn("task_list", {
    address: {
      type: "text",
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("task_list", "address");
};

