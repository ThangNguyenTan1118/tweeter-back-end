import "reflect-metadata";
import "dotenv-safe/config";
import { __prod__ } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { HelloResolver } from "./resolvers/hello";
import { User } from "./entities/User";
import { Post } from "./entities/Post";
import { UserResolver } from "./resolvers/users";
import { PostResolver } from "./resolvers/posts";
import { Comment } from "./entities/Comment";
import { CommentResolver } from "./resolvers/comments";
import { Vote } from "./entities/Vote";
import { VoteResolver } from "./resolvers/votes";

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

const main = async () => {
  await createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    logging: true,
    synchronize: true,
    entities: [User, Post, Comment, Vote],
  });

  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [
        HelloResolver,
        UserResolver,
        PostResolver,
        CommentResolver,
        VoteResolver,
      ],
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
