import { User } from "../entities/User";
import { Resolver, Query } from "type-graphql";

@Resolver()
export class UserResolver {
  @Query(() => [User])
  async users() {
    const users = await User.find();
    return users;
  }
}
