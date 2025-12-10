export const up = (pgm) => {
  pgm.addColumn("task_list", {
    image_url: {
      type: "text",
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("task_list", "image_url");
};
