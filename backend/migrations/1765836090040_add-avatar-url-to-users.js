export const up = (pgm) => {
  pgm.addColumn("users", {
    avatar_url: {
      type: "text",
      notNull: false,
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("users", "avatar_url");
};
