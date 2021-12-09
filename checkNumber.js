const createCsWriter = require("csv-writer").createObjectCsvWriter;
const { Client } = require("whatsapp-web.js");
const path = require("path");

let results = [];

const checkNumbers = async (
  cont,
  results2,
  sessionData,
  client,
  time,
  filename
) => {
  for (let item of results2) {
    if (!item.Telefono) {
      results.push({
        Nombre: item.Nombre,
        valid: false,
        Telefono: item.Telefono.replace(/ /g, ""),
      });
      cont++;
      continue;
    }

    if (item.Telefono.length < 10) {
      results.push({
        Nombre: item.Nombre,
        valid: false,
        Telefono: item.Telefono.replace(/ /g, ""),
      });
      cont++;
      continue;
    }

    if (item.Telefono.trim().length > 10) {
      const phoneNumber = item.Telefono.replace(/ /g, "") + "@c.us";
      const check = await client.isRegisteredUser(phoneNumber);
      console.log(cont);
      cont++;
      try {
        if (check === true) {
          results.push({
            Nombre: item.Nombre,
            valid: true,
            Telefono: item.Telefono.replace(/ /g, ""),
          });
        } else {
          results.push({
            Nombre: item.Nombre,
            valid: false,
            Telefono: item.Telefono.replace(/ /g, ""),
          });
        }
      } catch (e) {
        results.push({
          Nombre: item.Nombre,
          valid: false,
          Telefono: item.Telefono.replace(/ /g, ""),
        });
      }
    }

    if (item.Telefono.length === 10) {
      const phoneNumber = "52" + item.Telefono.replace(/ /g, "") + "@c.us";
      const check = await client.isRegisteredUser(phoneNumber);
      console.log(cont);
      cont++;
      try {
        if (check === true) {
          results.push({
            Nombre: item.Nombre,
            valid: true,
            Telefono: "52" + item.Telefono.replace(/ /g, ""),
          });
        } else {
          results.push({
            Nombre: item.Nombre,
            valid: false,
            Telefono: "52" + item.Telefono.replace(/ /g, ""),
          });
        }
      } catch (e) {
        results.push({
          Nombre: item.Nombre,
          valid: false,
          Telefono: "52" + item.Telefono.replace(/ /g, ""),
        });
      }
    }

    if (cont % 1190 == 0) {
      client = null;
      client = new Client({
        session: sessionData,
      });
      console.log("Pause");
      await client.initialize();
    }
  }
  console.log("the result is ");

  const pahtName = path.join(__dirname, `/public/New${filename}`);

  const csWriter = createCsWriter({
    path: pahtName,
    header: [
      { id: "Nombre", title: "Nombre" },
      { id: "Telefono", title: "Telefono" },
      { id: "valid", title: "valid" },
    ],
  });

  csWriter.writeRecords(results);
  const today2 = new Date();
  const time2 =
    today2.getHours() + ":" + today2.getMinutes() + ":" + today2.getSeconds();
  console.log(time2);
  console.log(time);
};

module.exports = { checkNumbers };
