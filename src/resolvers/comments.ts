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
  FieldResolver,
  Root,
} from "type-graphql";
import { Comment } from "../entities/Comment";
import { MyContext } from "../types";
import { UserInputError, ForbiddenError } from "apollo-server-express";
import { Post } from "../entities/Post";
import { User } from "../entities/User";

@InputType()
export class CommentContentInput {
  @Field(() => String)
  content!: string;
}

@Resolver((_of) => Comment)
export class CommentResolver {
  @FieldResolver()
  async user(@Root() comment: Comment) {
    comment = await Comment.findOneOrFail({
      relations: ["user"],
      where: {
        id: comment.id,
      },
    });

    const user = await User.findOneOrFail({
      where: {
        id: comment.user.id,
      },
    });

    return user;
  }

  @Query(() => [Comment])
  async comments() {
    const comments = await Comment.find({
      relations: ["user"],
    });
    return comments;
  }

  @Query(() => [Comment])
  async comment(@Arg("commentId") commentId: number) {
    const comment = await Comment.findOne({
      relations: ["user"],
      where: {
        id: commentId,
      },
    });
    return comment;
  }

  @Mutation(() => Comment)
  @UseMiddleware(isAuth)
  async createComment(
    @Arg("postId") postId: number,
    @Arg("input") input: CommentContentInput,
    @Ctx() { req }: MyContext
  ) {
    const { content } = input;

    let comment = new Comment();
    const post = await Post.findOne({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new UserInputError("This post does not exist");
    }

    comment.content = content;
    comment.post = post;
    comment.user = req.user;

    comment = await comment.save();

    return comment;
  }

  @Mutation(() => Comment, { nullable: true })
  @UseMiddleware(isAuth)
  async updateComment(
    @Arg("commentId") commentId: number,
    @Arg("input") input: CommentContentInput,
    @Ctx() { req }: MyContext
  ) {
    const { content } = input;

    let comment = await Comment.findOne({
      id: commentId,
    });

    if (!comment) {
      throw new UserInputError("The comment with that ID does not exist");
    }

    if (comment.user.id !== req.user.id) {
      throw new ForbiddenError(
        "You don't have permission to update this comment"
      );
    }

    comment.content = content;

    comment = await comment.save();

    return comment;
  }

  @Mutation(() => Comment, { nullable: true })
  @UseMiddleware(isAuth)
  async deleteComment(
    @Arg("commentId") commentId: number,
    @Ctx() { req }: MyContext
  ) {
    let comment = await Comment.findOne({
      id: commentId,
    });

    if (!comment) {
      throw new UserInputError("The comment with that ID does not exist");
    }

    if (comment.user.id !== req.user.id) {
      throw new ForbiddenError(
        "You don't have permission to delete this comment"
      );
    }

    await Comment.delete(comment);

    return comment;
  }
}
