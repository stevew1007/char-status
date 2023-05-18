import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Image from "next/image";
// import Link from "next/link";

import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { PageLayout } from "~/components/layout";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState("");
  // console.log("user::: ", user);
  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      toast.success("Post created!");
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      console.log("e::: ", e);
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Something went wrong!");
      }
    },
  });
  // mutate({ content: "Hello World!" });

  if (!user) return null;
  return (
    <div className="flex w-full gap-3">
      <UserButton />
      <input
        placeholder="Type something..."
        className="grow bg-transparent outline-none"
        value={input}
        type="text"
        onChange={(e) => setInput(e.target.value)}
        disabled={isPosting}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== "") {
              mutate({ content: input });
            }
          }
        }}
      />
      {input !== "" && (
        <button onClick={() => mutate({ content: input })} disabled={isPosting}>
          Post
        </button>
      )}
      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  );
};

type PostWithAuthor = RouterOutputs["posts"]["getAll"][number];

const PostView = (props: PostWithAuthor) => {
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

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;
  if (!data) return <div>Something went wrong</div>;
  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn: userSignedIn } = useUser();
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();
  if (!userLoaded && !postsLoading) return <div />;
  if (postsLoading) return <LoadingPage />;
  if (!data) return <div>Something went wrong</div>;
  return (
    <PageLayout>
      <div className="flex border-b border-slate-400 p-4">
        {!userSignedIn && <SignInButton />}
        {userSignedIn && <CreatePostWizard />}
      </div>
      <Feed />
    </PageLayout>
  );
};

export default Home;
