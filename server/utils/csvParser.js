const fs = require("fs");
const csv = require("csv-parser");

const BOOL_FIELDS = ["isSupernumerary", "isNRI", "ociStatus", "isForeignNational"];

const parseCSV = (filePath) =>
  new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim(),
          mapValues: ({ value }) => value.trim(),
        })
      )
      .on("data", (row) => {
        BOOL_FIELDS.forEach((f) => {
          row[f] = String(row[f]).toLowerCase() === "true";
        });
        rows.push(row);
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });

module.exports = { parseCSV };