import type {
  GetStaticPropsContext,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import Head from "next/head";
import { api } from "~/utils/api";

type PageProps = InferGetStaticPropsType<typeof getStaticProps>;
const ProfilePage: NextPage<PageProps> = ({ emailAddress }) => {
  const { data } = api.profile.getUserByEmail.useQuery({
    emailAddress,
  });

  // if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>Something went wrong</div>;

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div className="relative h-36 border-b border-slate-400 bg-slate-600">
          <Image
            src={data.profileImageUrl}
            alt={`${data.username ?? ""} profile pic`}
            width={128}
            height={128}
            className="absolute bottom-0 left-0 -mb-[64px] ml-4 rounded-full border-4 border-black"
          />
        </div>
        <div className="h-[64px]"></div>
        <div className="p-4 text-2xl font-bold">{data.username}</div>
        <div className="w-full border-b border-slate-400" />
        <ProfileFeed userId={data.id} />
      </PageLayout>
    </>
  );
};

import { createServerSideHelpers } from "@trpc/react-query/server";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import SuperJSON from "superjson";
import { PageLayout } from "~/components/layout";
import Image from "next/image";
import { ProfileFeed } from "~/components/postview";
// import { createContext } from "server/context";

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: SuperJSON, // optional - adds superjson serialization
  });

  const slug = context.params?.slug;

  if (typeof slug != "string") throw new Error("no slug");

  const emailAddress = slug.replace("@", "");
  // console.log("emailAddress::: ", emailAddress);

  await helpers.profile.getUserByEmail.prefetch({ emailAddress });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      emailAddress,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default ProfilePage;
