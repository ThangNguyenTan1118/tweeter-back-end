import "reflect-metadata";
import "dotenv-safe/config";
import { __prod__ } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { HelloResolver } from "./resolvers/hello";
import { User } from "./entities/User";
import { UserResolver } from "./resolvers/users";

const main = async () => {
  await createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    logging: true,
    synchronize: true,
    entities: [User],
  });

  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({
      req,
      res,
    }),
  });

  apolloServer.applyMiddleware({
    app,
  });

  app.listen(parseInt(process.env.PORT), () => {
    console.log("server started on localhost:5000");
  });
};

main().catch((err) => {
  console.error(err);
});
