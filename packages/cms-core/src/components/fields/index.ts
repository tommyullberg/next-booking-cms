import { CMSTextField } from "./text-field";
import { CMSImageField } from "./image-field";
import { CMSNavigationField } from "./navigation-field";

export const CMSField = {
  Text: CMSTextField,
  Image: CMSImageField,
  Navigation: CMSNavigationField,
};

export { CMSTextField, CMSImageField, CMSNavigationField };
export * from "./provider";
export * from "./types";
