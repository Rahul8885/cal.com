import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { RefCallback, ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";

import { useOrgBranding } from "@calcom/features/ee/organizations/context/provider";
import { WEBSITE_URL, IS_SELF_HOSTED } from "@calcom/lib/constants";
import { trpc } from "@calcom/trpc/react";
import type { AppRouter } from "@calcom/trpc/server/routers/_app";

import useRouterQuery from "@lib/hooks/useRouterQuery";

import type { TRPCClientErrorLike } from "@trpc/client";

interface UsernameAvailabilityFieldProps {
  onSuccessMutation?: () => void;
  onErrorMutation?: (error: TRPCClientErrorLike<AppRouter>) => void;
}

interface ICustomUsernameProps extends UsernameAvailabilityFieldProps {
  currentUsername: string | undefined;
  setCurrentUsername?: (newUsername: string) => void;
  inputUsernameValue: string | undefined;
  usernameRef: RefCallback<HTMLInputElement>;
  setInputUsernameValue: (value: string) => void;
  disabled?: boolean | undefined;
  addOnLeading?: ReactNode;
  isPremium: boolean;
}

const PremiumTextfield = dynamic(() => import("./PremiumTextfield").then((m) => m.PremiumTextfield), {
  ssr: false,
});
const UsernameTextfield = dynamic(() => import("./UsernameTextfield").then((m) => m.UsernameTextfield), {
  ssr: false,
});

export const UsernameAvailability = (props: ICustomUsernameProps) => {
  const { isPremium, ...otherProps } = props;
  const UsernameAvailabilityComponent = isPremium ? PremiumTextfield : UsernameTextfield;
  return <UsernameAvailabilityComponent {...otherProps} />;
};

export const UsernameAvailabilityField = ({
  onSuccessMutation,
  onErrorMutation,
}: UsernameAvailabilityFieldProps) => {
  const searchParams = useSearchParams();
  const [user] = trpc.viewer.me.useSuspenseQuery();
  const [currentUsernameState, setCurrentUsernameState] = useState(user.username || "");
  const { username: usernameFromQuery, setQuery: setUsernameFromQuery } = useRouterQuery("username");
  const { username: currentUsername, setQuery: setCurrentUsername } =
    searchParams?.get("username") && user.username === null
      ? { username: usernameFromQuery, setQuery: setUsernameFromQuery }
      : { username: currentUsernameState || "", setQuery: setCurrentUsernameState };
  const formMethods = useForm({
    defaultValues: {
      username: currentUsername,
    },
  });

  const orgBranding = useOrgBranding();

  const usernamePrefix = orgBranding
    ? orgBranding?.fullDomain.replace(/^(https?:|)\/\//, "")
    : `${WEBSITE_URL?.replace(/^(https?:|)\/\//, "")}`;

  const isPremium = !IS_SELF_HOSTED && !user.organization?.id;

  return (
    <Controller
      control={formMethods.control}
      name="username"
      render={({ field: { ref, onChange, value } }) => (
        <UsernameAvailability
          currentUsername={currentUsername}
          setCurrentUsername={setCurrentUsername}
          inputUsernameValue={value}
          usernameRef={ref}
          setInputUsernameValue={onChange}
          onSuccessMutation={onSuccessMutation}
          onErrorMutation={onErrorMutation}
          disabled={!!user.organization?.id}
          addOnLeading={`${usernamePrefix}/`}
          isPremium={isPremium}
        />
      )}
    />
  );
};
