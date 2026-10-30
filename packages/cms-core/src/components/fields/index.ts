import { CMSTextField } from "./text-field";
import { CMSImageField } from "./image-field";
import { CMSNavigationField } from "./navigation-field";
import { CMSGalleryField } from "./gallery-field";

export const CMSField = {
  Text: CMSTextField,
  Image: CMSImageField,
  Navigation: CMSNavigationField,
  Gallery: CMSGalleryField,
};

export { CMSTextField, CMSImageField, CMSNavigationField, CMSGalleryField };
export * from "./provider";
export * from "./types";
