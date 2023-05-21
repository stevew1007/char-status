import Image from "next/image";
// import Link from "next/link";
import { type RouterOutputs, api } from "~/utils/api";

import dayjs from "dayjs";
import Link from "next/link";
import { LoadingPage } from "./loading";

type PostWithAuthor = RouterOutputs["posts"]["getAll"][number];

export const ProfileFeed = (props: { userId: string }) => {
  const { data, isLoading } = api.posts.getPostsByUserID.useQuery({
    userId: props.userId,
  });

  if (isLoading) return <LoadingPage />;
  if (!data || data.length === 0) return <div>User has not posted</div>;
  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

export const PostView = (props: PostWithAuthor) => {
  const { post, author } = props;
  // console.log(props);
  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Image
        src={author?.profileImageUrl ?? "/images/default-profile.png"}
        className="h-8 w-8 rounded-full"
        alt="Profile Image"
        width={56}
        height={56}
      />

      <div className="flex flex-col">
        <div className="flex gap-2 text-slate-300">
          <Link href={`/@${author?.emailAddress || 404}`}>
            <span>{author?.emailAddress}</span>
          </Link>
          <span className="font-thin">{`${dayjs(
            post.createdAt
          ).fromNow()}`}</span>
        </div>
        <span>{post.content}</span>
      </div>
    </div>
  );
};
