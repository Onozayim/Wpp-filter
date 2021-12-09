const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const express = require("express");
const qrcode = require("qrcode-terminal");
const { Client } = require("whatsapp-web.js");
const { ApolloServer, gql } = require("apollo-server-express");
const { GraphQLUpload, graphqlUploadExpress } = require("graphql-upload");
const { finished } = require("stream/promises");
//const data = require("./public");

const { checkNumbers } = require("./checkNumber");
const { resolve } = require("path");
const { rejects } = require("assert");
// const app = new express()

const SESSION_FILE_PATH = "./session.json";
let client;
let sessionData;

let results2 = [];

let code = "hola";

const typeDefs = gql`
  scalar Upload

  type File {
    url: String!
  }

  # type Code {
  #   codeS: String!
  #   flag: Boolean!
  # }

  type Query {
    hello: String!
    #    getQr: String
  }

  type Mutation {
    uploadFile(file: Upload!): File!
  }
`;

const resolvers = {
  Upload: GraphQLUpload,
  Query: {
    hello: () => {
      return "hello";
    },
    // getQr: async () => {
    //   const flag = fs.existsSync(SESSION_FILE_PATH);

    //   if (flag) {
    //     sessionData = require(SESSION_FILE_PATH);

    //     client = new Client({
    //       session: sessionData,
    //     });

    //     client.on("ready", () => {
    //       console.log("ready");
    //     });

    //     client.initialize();
    //     return "You are login";
    //   } else {
    //     code = await promesa();
    //     return code;
    //   }
    // },
  },

  Mutation: {
    uploadFile: async (parents, { file }) => {
      const { createReadStream, filename, mimetype, encoding } = await file;

      console.log(filename);

      const stream = createReadStream();

      const pathName = path.join(__dirname, `/public/${filename}`);
      const out = fs.createWriteStream(pathName);
      stream.pipe(out);

      await finished(out);

      fs.createReadStream(`./public/${filename}`)
        .pipe(csv(["Nombre", "Telefono", "valid"]))
        .on("data", (item) => {
          const flag = checkForRepeatedNumbers(item.Telefono);
          if (flag === true) {
            results2.push(item);
          }
        })
        .on("end", () => {
          console.log("Done");
          console.log(results2.length);
          console.log(results2);
          let cont = 0;

          const today = new Date();
          const time =
            today.getHours() +
            ":" +
            today.getMinutes() +
            ":" +
            today.getSeconds();
          console.log(time);

          checkNumbers(cont, results2, sessionData, client, time, filename);
        });

      return {
        url: `htpp://localhost:4000/images/${filename}`,
      };
    },
  },
};

// const promesa = new Promise((resolve, rejects) => {
//   const client = new Client();
//   client.on("qr", (qr) => {
//     qrcode.generate(qr, { small: true });
//     code = qr;
//     console.log(code);
//   });
//   resolve(code);
//   client.on("authenticated", (session) => {
//     console.log(code);
//     sessionData = session;
//     fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
//       if (err) {
//         console.log(err);
//       }
//     });
//   });

//   client.initialize();
// });

const withSession = () => {
  sessionData = require(SESSION_FILE_PATH);

  client = new Client({
    session: sessionData,
  });

  client.on("ready", () => {
    console.log("ready");
  });

  client.initialize();
};

const withOutSession = () => {
  client = new Client();

  client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    code = qr;
  });

  client.on("authenticated", (session) => {
    console.log(code);
    sessionData = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
      if (err) {
        console.log(err);
      }
    });
  });

  client.initialize();
};

const checkForRepeatedNumbers = (value) => {
  for (const item of results2) {
    if (item.Phone === value) {
      return false;
    }
  }
  return true;
};

fs.existsSync(SESSION_FILE_PATH) ? withSession() : withOutSession();

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  const app = express();

  // This middleware should be added before calling `applyMiddleware`.
  app.use(graphqlUploadExpress());

  server.applyMiddleware({ app });

  await new Promise((r) => app.listen({ port: 4000 }, r));

  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

startServer();
