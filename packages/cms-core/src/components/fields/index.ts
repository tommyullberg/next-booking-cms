import { CMSTextField } from "./text-field";
import { CMSImageField } from "./image-field";
import { CMSNavigationField } from "./navigation-field";
import { CMSGalleryField } from "./gallery-field";
import { CMSFieldGroup } from "./field-group";

export const CMSField = {
  Text: CMSTextField,
  Image: CMSImageField,
  Navigation: CMSNavigationField,
  Gallery: CMSGalleryField,
  Group: CMSFieldGroup,
  FieldGroup: CMSFieldGroup,
};

export {
  CMSTextField,
  CMSImageField,
  CMSNavigationField,
  CMSGalleryField,
  CMSFieldGroup,
};
export * from "./provider";
export * from "./types";
export * from "./field-group";
