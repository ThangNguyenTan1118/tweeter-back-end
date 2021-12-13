import { isAuth } from "../middlewares/jwtAuth";
import {
  Resolver,
  Mutation,
  Arg,
  Ctx,
  UseMiddleware,
  FieldResolver,
  Root,
} from "type-graphql";
import { Vote } from "../entities/Vote";
import { MyContext } from "../types";
import { UserInputError } from "apollo-server-express";
import { Post } from "../entities/Post";
import { User } from "../entities/User";

@Resolver((_of) => Vote)
export class VoteResolver {
  @FieldResolver(() => Vote, { nullable: true })
  async user(@Root() vote: Vote) {
    try {
      vote = await Vote.findOneOrFail({
        relations: ["user"],
        where: {
          id: vote.id,
        },
      });

      const user = await User.findOneOrFail({
        where: {
          id: vote.user.id,
        },
      });

      return user;
    } catch (error) {
      return null;
    }
  }

  @Mutation(() => Vote)
  @UseMiddleware(isAuth)
  async vote(@Arg("postId") postId: number, @Ctx() { req }: MyContext) {
    let vote = await Vote.findOne({
      where: {
        post: postId,
        user: req.user.id,
      },
    });

    if (vote) {
      await Vote.delete(vote.id);
      return vote;
    }

    vote = new Vote();

    const post = await Post.findOne({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new UserInputError("This post does not exist");
    }

    vote.post = post;
    vote.user = req.user;

    vote = await vote.save();

    return vote;
  }
}
