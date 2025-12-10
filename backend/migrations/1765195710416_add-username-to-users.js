export const up = (pgm) => {
  pgm.addColumn("users", {
    username: {
      type: "text",
      notNull: false,
      unique: true,
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("users", "username");
};
