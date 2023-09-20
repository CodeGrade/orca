export const collationSchema = {
  $id: "https://orca-schemas.com/shared/collation",
  type: "object",
  properties: {
    type: { type: "string", enum: ["user", "team"] },
    id: { type: "string" },
  },
};
