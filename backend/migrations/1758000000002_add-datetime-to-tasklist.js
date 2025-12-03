export const up = (pgm) => {
  pgm.addColumn("task_list", {
    due_date: {
      type: "timestamp",
    },
    start_time: {
      type: "text",
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("task_list", "due_date");
  pgm.dropColumn("task_list", "start_time");
};

