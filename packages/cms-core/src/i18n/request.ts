import { getRequestConfig } from "next-intl/server";
import { getCurrentAdminLocaleAction } from "@cms/actions/administrators";
import { getAdminMessages } from "./get-messages";

export default getRequestConfig(async () => {
  // Read administrator's locale safely from the database profile per request
  const locale = await getCurrentAdminLocaleAction();

  return {
    locale,
    messages: getAdminMessages(locale),
  };
});

