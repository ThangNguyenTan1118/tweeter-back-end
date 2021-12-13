import { isAuth } from "../middlewares/jwtAuth";
import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  UseMiddleware,
  InputType,
  Field,
} from "type-graphql";
import { Post } from "../entities/Post";
import { MyContext } from "../types";
import { UserInputError, ForbiddenError } from "apollo-server-express";

@InputType()
export class PostContentInput {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  postText!: string;

  @Field(() => String)
  imageURL!: string;
}

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
    @Arg("input") input: PostContentInput,
    @Ctx() { req }: MyContext
  ) {
    const { title, postText, imageURL } = input;

    let post = new Post();

    post.title = title;
    post.postText = postText;
    post.imageURL = imageURL;
    post.user = req.user;

    post = await post.save();

    return post;
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("postId") postId: number,
    @Arg("input") input: PostContentInput,
    @Ctx() { req }: MyContext
  ) {
    const { title, postText, imageURL } = input;

    let post = await Post.findOne({
      id: postId,
    });

    if (!post) {
      throw new UserInputError("The post with that ID does not exist");
    }

    if (post.user.id !== req.user.id) {
      throw new ForbiddenError("You don't have permission to update this post");
    }

    post.title = title;
    post.postText = postText;
    post.imageURL = imageURL;

    post = await post.save();

    return post;
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async deletePost(@Arg("postId") postId: number, @Ctx() { req }: MyContext) {
    let post = await Post.findOne({
      id: postId,
    });

    if (!post) {
      throw new UserInputError("The post with that ID does not exist");
    }

    if (post.user.id !== req.user.id) {
      throw new ForbiddenError("You don't have permission to delete this post");
    }

    await Post.delete(post);

    return post;
  }
}
