import { isAuth } from "../middlewares/jwtAuth";
import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  UseMiddleware,
} from "type-graphql";
import { Post } from "../entities/Post";
import { MyContext } from "../types";

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts() {
    const posts = await Post.find({
      relations: ["user"],
    });
    return posts;
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("title") title: string,
    @Arg("postText") postText: string,
    @Arg("imageURL") imageURL: string,
    @Ctx() { req }: MyContext
  ) {
    let post = new Post();

    post.title = title;
    post.postText = postText;
    post.imageURL = imageURL;
    post.user = req.user;

    post = await post.save();

    return post;
  }
}
