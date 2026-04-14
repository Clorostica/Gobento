import dotenv from "dotenv";
dotenv.config();

const D1_API = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/d1/database/${process.env.CF_D1_DATABASE_ID}/query`;

// Converts PostgreSQL-style $1, $2 placeholders to SQLite ? placeholders,
// expanding the params array for repeated references (e.g. $1 used twice).
function convertQuery(sql, params = []) {
  const newParams = [];
  const convertedSql = sql.replace(/\$(\d+)/g, (_, n) => {
    newParams.push(params[parseInt(n, 10) - 1]);
    return "?";
  });
  return { sql: convertedSql, params: newParams };
}

async function query(sql, params = []) {
  const { sql: convertedSql, params: convertedParams } = convertQuery(
    sql,
    params
  );

  const response = await fetch(D1_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql: convertedSql, params: convertedParams }),
  });

  const data = await response.json();

  if (!data.success) {
    const errMsg = data.errors?.[0]?.message || "D1 query failed";
    const err = new Error(errMsg);
    if (errMsg.includes("UNIQUE constraint failed")) {
      err.code = "23505";
    }
    throw err;
  }

  const result = data.result[0];
  return {
    rows: result.results || [],
    rowCount: result.meta?.changes ?? 0,
  };
}

export const pool = { query };

