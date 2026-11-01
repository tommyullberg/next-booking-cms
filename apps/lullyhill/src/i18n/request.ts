import { getRequestConfig } from "next-intl/server";
import { getCurrentAdminLocaleAction, getAdminMessages } from "@next-booking/cms-core/server";

export default getRequestConfig(async () => {
  const locale = await getCurrentAdminLocaleAction();
  return {
    locale,
    messages: getAdminMessages(locale),
  };
});

