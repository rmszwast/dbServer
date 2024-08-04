"use strict";

import express from "express";
import { pool } from "./db-connector.mjs";

const app = express();
const port = 4669;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

// CORS middleware
app.use("/randnum", (req, res, next) => {
  res.set("Access-Control-Allow-Headers", "*");
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

// TODO: serve homepage
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

// Parse incoming request with JSON payloads.
app.use(express.json());

// Sends INSERT (create) queries to the database.
// Returns status 200 for successful requests.
// Failed requests are status >= 400.
app.use(express.json());
app.post("/api/:table", async (req, res) => {
  const tbl = req.params.table.toUpperCase().replace(/-/g, "_");
  const body = await req.body;
  const cols = Object.keys(body).map((x) => pool.escapeId(x));
  const vals = Object.values(body).map((x) => pool.escape(x));
  switch (tbl) {
    case "DEVELOPERS":
      cols.forEach((_, i) => {
        if (cols[i] === "`Country`") {
          cols[i] = "`CountryId`";
          vals[i] = `(SELECT CountryId FROM COUNTRIES WHERE Name = ${vals[i]})`;
        }
      });
      break;
    case "DEVELOPER_LANGUAGES":
      cols.forEach((_, i) => {
        if (cols[i] === "`Name`") {
          cols[i] = "`LanguageId`";
          vals[i] = `(SELECT LanguageId FROM LANGUAGES WHERE Name = ${vals[i]})`;
        }
      });
      break;
    case "DEVELOPER_PLATFORMS":
      cols.forEach((_, i) => {
        if (cols[i] === "`Name`") {
          cols[i] = "`PlatformId`";
          vals[i] = `(SELECT PlatformId FROM PLATFORMS WHERE Name = ${vals[i]})`;
        }
      });
      break;
    case "DEVELOPER_TECHNOLOGIES":
      cols.forEach((_, i) => {
        if (cols[i] === "`Name`") {
          cols[i] = "`TechnologyId`";
          vals[i] = `(SELECT TechnologyId FROM TECHNOLOGIES WHERE Name = ${vals[i]})`;
        }
      });
      break;
  }

  const query = `INSERT INTO ?? (${cols.join(", ")}) VALUES (${vals.join(", ")});`
  pool.query(query, [tbl], (error, results) => {
    if (error) {
      res.status(400).send(error);
      return;
    }
    res.status(200).send(results);
  });
});


// Sends SELECT (read) queries to the database.
// Optionally, the path may be extened to specify a single column.
// Returns status 200 and the query results on success.
// Return status >= 400 and an error message on failure.
app.get("/api/:table/:column?", (req, res) => {
  // Replace '-' with '_' and uppercase string.
  const tbl = req.params.table.replace(/-/g, "_").toUpperCase();
  let col = req.params.column;
  if (col) {
    // Remove '-' and titlecase.
    col = col.replace(/\b./g, char => char === "-"? "" : char.toUpperCase());
    col = pool.escapeId(col);
  }
  let selectCol;
  let fromTbl;

  switch (tbl) {
    case "DEVELOPERS":
      if (col) {
        selectCol = col;
        fromTbl =  "DEVELOPERS";
      }
      else {
        selectCol = "".concat(
          "a.DeveloperId, a.DevType, b.Name AS Country, a.Age, a.EdLevel, ",
          "a.YearsCodePro, a.CompTotal, a.ConvertedCompYearly"
        );
        fromTbl = "DEVELOPERS AS a JOIN COUNTRIES AS b ON a.CountryId = b.CountryId";
      } 
      break;
    case "LANGUAGES":
      selectCol = col? col : "*";
      fromTbl = "LANGUAGES";
      break;
    case "PLATFORMS":
      selectCol = col? col : "*";
      fromTbl = "PLATFORMS";
      break;
    case "TECHNOLOGIES":
      selectCol = col? col : "*";
      fromTbl = "TECHNOLOGIES";
      break;
    case "COUNTRIES":
      selectCol = col? col : "*";
      fromTbl = "COUNTRIES";
      break;
    case "DEVELOPER_LANGUAGES":
      if (col) {
        selectCol = col;
        fromTbl = "DEVELOPER_LANGUAGES";
      }
      else {
        selectCol = "".concat(
          "a.DeveloperId, b.DevType, a.LanguageId, ",
          "c.Name, a.HaveWorkedWith, a.WantToWorkWith"
        )
        fromTbl = "".concat(
          "DEVELOPER_LANGUAGES AS a ",
          "JOIN DEVELOPERS AS b ON a.DeveloperId = b.DeveloperId ",
          "JOIN LANGUAGES AS c ON a.LanguageId = c.LanguageId"
        );
      }
      break;
    case "DEVELOPER_PLATFORMS":
      if (col) {
        selectCol = col;
        fromTbl = "DEVELOPER_PLATFORMS";
      }
      else {
        selectCol = "".concat(
          "a.DeveloperId, b.DevType, a.PlatformId, ",
          "c.Name, a.HaveWorkedWith, a.WantToWorkWith"
        )
        fromTbl = "".concat(
          "DEVELOPER_PLATFORMS AS a ",
          "JOIN DEVELOPERS AS b ON a.DeveloperId = b.DeveloperId ",
          "JOIN PLATFORMS AS c ON a.PlatformId = c.PlatformId"
        );
      }
      break;
    case "DEVELOPER_TECHNOLOGIES":
      if (col) {
        selectCol = col;
        fromTbl = "DEVELOPER_TECHNOLOGIES";
      }
      else {
        selectCol = "".concat(
          "a.DeveloperId, b.DevType, a.TechnologyId, ",
          "c.Name, a.HaveWorkedWith, a.WantToWorkWith"
        )
        fromTbl = "".concat(
          "DEVELOPER_TECHNOLOGIES AS a ",
          "JOIN DEVELOPERS AS b ON a.DeveloperId = b.DeveloperId ",
          "JOIN TECHNOLOGIES AS c ON a.TechnologyId = c.TechnologyId"
        );
      }
      break;
    default:
      res.setHeader("Content-Type", "application/json")
      res.status(400).send(JSON.stringify({error: "unknown resourse"}));
      return;
  }

  const query = `SELECT ${selectCol} FROM ${fromTbl};`;
  pool.query(query, (error, results) => {
    if (error) {
      res.status(400).send(error);
      return;
    }
    res.status(200).send(results);
  });
});


// Sends UPDATE queries to the database.
// Returns status 200 for successful requests.
// Failed requests are status >= 400.
app.put("/api/:table", async (req, res) => {
  const tbl = req.params.table.toUpperCase().replace(/-/g, "_");
  const body = await req.body;
  const updateCond = Object.entries(body.updateCond).map(([k, v]) => ({[k]:v}));
  const updateVals = Object.entries(body.updateVals);
  switch (tbl) {
    case "DEVELOPERS":
      updateVals.forEach(([k, v], i, arr) => {
        if (k === "Country") {
          arr[i] = "".concat(
            `CountryId = `,
            `(SELECT CountryId FROM COUNTRIES WHERE Name = ${pool.escape(v)})`
          )
        }
        else {
          arr[i] = `${pool.escapeId(k)} = ${pool.escape(v)}`;
        }
      });
      break;
    case "DEVELOPER_LANGUAGES":
      updateVals.forEach(([k, v], i, arr) => {
        if (k === "LanguageName") {
          arr[i] = "".concat(
            `LanguageId = `,
            `(SELECT LanguageId FROM LANGUAGES WHERE Name = ${pool.escape(v)})`
          );
        }
        else {
          arr[i] = `${pool.escapeId(k)} = ${pool.escape(v)}`;
        }
      });
      break;
    case "DEVELOPER_PLATFORMS":
      updateVals.forEach(([k, v], i, arr) => {
        if (k === "PlatformName") {
          arr[i] = "".concat(
            `PlatformId = `,
            `(SELECT PlatformId FROM PLATFORMS WHERE Name = ${pool.escape(v)})`
          );
        }
        else {
          arr[i] = `${pool.escapeId(k)} = ${pool.escape(v)}`;
        }
      });
      break;
    case "DEVELOPER_TECHNOLOGIES":
      updateVals.forEach(([k, v], i, arr) => {
        if (k === "TechnologyName") {
          arr[i] = "".concat(
            `TechnologyId = `,
            `(SELECT TechnologyId FROM TECHNOLOGIES WHERE Name = ${pool.escape(v)})`
          );
        }
        else {
          arr[i] = `${pool.escapeId(k)} = ${pool.escape(v)}`;
        }
      });
      break;
  }
  const query = `UPDATE ?? SET ${updateVals.join(", ")} WHERE ${updateCond.map(() => "?").join(" AND ")};`;
  pool.query(query, [tbl, ...updateCond], (error, results) => {
    if (error) {
      res.status(400).send(error);
      return;
    }
    res.status(200).send(results);
  });
});


// Sends DELETE queries to the database.
// Returns status 200 for successful requests.
// Failed requests are status >= 400.
app.delete("/api/:table", async (req, res) => {
  const tbl = req.params.table.toUpperCase().replace(/-/g, "_");
  const body = await req.body;
  const deleteCond = Object.entries(body.deleteCond).map(([k, v]) => ({[k]:v}));
  const query = `DELETE FROM ?? WHERE ${deleteCond.map(() => "?").join(" AND ")};`;
  pool.query(query, [tbl, ...deleteCond], (error, results) => {
    if (error) {
      res.status(400).send(error);
      return;
    }
    res.status(200).send(results);
  });
});

