import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../types";
import { AuthenticationError } from "apollo-server-express";
import jwt from "jsonwebtoken";
import { User } from "../entities/User";

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  let accessToken = context.req.header("Authorization");
  let user: User;

  if (!accessToken) {
    throw new AuthenticationError("Not authenticated");
  }

  accessToken = accessToken.split(" ")[1];

  try {
    const validToken = jwt.verify(accessToken, process.env.JWT_SECRECT);

    if (typeof validToken === "string") {
      throw new AuthenticationError("Not authenticated");
    }

    user = validToken as User;

    if (!user) {
      throw new AuthenticationError("Not authenticated");
    }

    context.req.user = user;

    return next();
  } catch (err) {
    throw new AuthenticationError("Not authenticated");
  }
};
