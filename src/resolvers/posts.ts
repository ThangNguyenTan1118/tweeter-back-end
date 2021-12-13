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
  Root,
  FieldResolver,
  Int,
} from "type-graphql";
import { Post } from "../entities/Post";
import { MyContext } from "../types";
import { UserInputError, ForbiddenError } from "apollo-server-express";
import { Vote } from "../entities/Vote";

@InputType()
export class PostContentInput {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  postText!: string;

  @Field(() => String)
  imageURL!: string;
}

@Resolver((_of) => Post)
export class PostResolver {
  @FieldResolver(() => Int)
  async totalLikes(@Root() post: Post) {
    const likeCount = await Vote.count({
      relations: ["user"],
      where: {
        id: post.id,
      },
    });

    return likeCount;
  }

  @Query(() => [Post])
  async posts() {
    const posts = await Post.find({
      relations: ["user", "comments", "votes"],
    });
    return posts;
  }

  @Query(() => [Post])
  async post(@Arg("postId") postId: number) {
    const post = await Post.findOne({
      relations: ["user", "comments", "votes"],
      where: {
        id: postId,
      },
    });
    return post;
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

    await Post.delete(post.id);

    return post;
  }
}
