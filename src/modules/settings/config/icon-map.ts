import AboutIcon from "@/assets/icons/settings/about.svg";
import CameraIcon from "@/assets/icons/settings/camera.svg";
import CheckIcon from "@/assets/icons/settings/check.svg";
import ContactIcon from "@/assets/icons/settings/contact.svg";
import DisplayIcon from "@/assets/icons/settings/display.svg";
import FilmstripIcon from "@/assets/icons/settings/filmstrip.svg";
import LocationIcon from "@/assets/icons/settings/location.svg";
import LogoutIcon from "@/assets/icons/settings/logout.svg";
import NotificationIcon from "@/assets/icons/settings/notification.svg";
import LockIcon from "@/assets/icons/settings/lock.svg";
import SosIcon from "@/assets/icons/settings/sos.svg";
import ArchiveIcon from "@/assets/icons/settings/archive.svg";
import PrivacyIcon from "@/assets/icons/settings/privacy.svg";
import TermsIcon from "@/assets/icons/settings/terms.svg";
import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";

export const settingsIconMap: Record<string, ComponentType<SvgProps>> = {
  about: AboutIcon,
  camera: CameraIcon,
  check: CheckIcon,
  contact: ContactIcon,
  display: DisplayIcon,
  filmstrip: FilmstripIcon,
  location: LocationIcon,
  logout: LogoutIcon,
  notification: NotificationIcon,
  lock: LockIcon,
  sos: SosIcon,
  archive: ArchiveIcon,
  privacy: PrivacyIcon,
  terms: TermsIcon,
};
