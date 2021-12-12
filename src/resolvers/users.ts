import { User } from "../entities/User";
import {
  Resolver,
  Query,
  Mutation,
  ObjectType,
  Field,
  InputType,
  Arg,
} from "type-graphql";
import { UserInputError } from "apollo-server-express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

@ObjectType()
export class AuthUser {
  @Field(() => User)
  user!: User;

  @Field(() => String)
  token!: string;
}

@InputType()
export class UsernamePasswordInput {
  @Field(() => String)
  email!: string;

  @Field(() => String)
  username!: string;

  @Field(() => String)
  password!: string;
}

@Resolver()
export class UserResolver {
  @Query(() => [User])
  async users() {
    const users = await User.find();
    return users;
  }

  @Mutation(() => AuthUser)
  async signup(@Arg("input") input: UsernamePasswordInput) {
    const { username, email } = input;
    let { password } = input;

    const existedUser = await User.findOne({
      where: {
        email,
      },
    });

    if (existedUser) {
      throw new UserInputError("Email has already been taken", {
        errors: {
          email: "Email has already been taken",
        },
      });
    }

    password = await argon2.hash(password);

    let user = new User();

    user.username = username;
    user.email = email;
    user.password = password;

    user = await user.save();

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRECT
    );

    return {
      user,
      token,
    };
  }

  @Mutation(() => AuthUser)
  async signin(@Arg("email") email: string, @Arg("password") password: string) {
    const existedUser = await User.findOne({
      where: {
        email,
      },
    });

    if (!existedUser) {
      throw new UserInputError("Invalid email or password", {
        errors: {
          email: "Invalid email",
          password: "Invalid password",
        },
      });
    }

    const isPasswordValidated = await argon2.verify(
      existedUser.password,
      password
    );

    if (!isPasswordValidated) {
      throw new UserInputError("Invalid email or password", {
        errors: {
          email: "Invalid email",
          password: "Invalid password",
        },
      });
    }

    const token = jwt.sign(
      {
        id: existedUser.id,
        username: existedUser.username,
        email: existedUser.email,
      },
      process.env.JWT_SECRECT
    );

    return {
      user: existedUser,
      token,
    };
  }
}
