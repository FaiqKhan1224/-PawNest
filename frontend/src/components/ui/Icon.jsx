import {
  FiHome, FiShoppingCart, FiHeart, FiUser, FiUsers, FiSearch, FiMenu, FiX, FiPlus, FiMinus, FiTrash2, FiEdit2, FiEye, FiEyeOff,
  FiFilter, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight, FiArrowRight, FiArrowLeft, FiCheck, FiStar, FiTruck, FiShield,
  FiHeadphones, FiPackage, FiBox, FiGrid, FiTag, FiArchive, FiBarChart2, FiCpu, FiSettings, FiLogOut, FiBell, FiMessageCircle, FiSend,
  FiPhone, FiMail, FiMapPin, FiImage, FiUpload, FiSave, FiAlertCircle, FiInfo, FiDollarSign, FiRefreshCw, FiExternalLink, FiCreditCard,
  FiClock, FiSliders, FiCheckCircle, FiXCircle, FiShoppingBag, FiTrendingUp, FiGift, FiFacebook, FiInstagram, FiTwitter, FiYoutube,
  FiLock, FiLayers, FiRepeat, FiCornerDownRight, FiMoreVertical, FiList, FiActivity, FiThumbsUp, FiClipboard,
} from 'react-icons/fi';

// One icon family (Feather / outline) is used everywhere so the interface stays visually consistent.
const ICONS = {
  home: FiHome, cart: FiShoppingCart, heart: FiHeart, user: FiUser, users: FiUsers, search: FiSearch, menu: FiMenu, x: FiX,
  plus: FiPlus, minus: FiMinus, trash: FiTrash2, edit: FiEdit2, eye: FiEye, 'eye-off': FiEyeOff, filter: FiFilter,
  'chevron-down': FiChevronDown, 'chevron-up': FiChevronUp, 'chevron-left': FiChevronLeft, 'chevron-right': FiChevronRight,
  'arrow-right': FiArrowRight, 'arrow-left': FiArrowLeft, check: FiCheck, star: FiStar, truck: FiTruck, shield: FiShield,
  headphones: FiHeadphones, package: FiPackage, box: FiBox, grid: FiGrid, tag: FiTag, archive: FiArchive, chart: FiBarChart2,
  cpu: FiCpu, settings: FiSettings, logout: FiLogOut, bell: FiBell, message: FiMessageCircle, send: FiSend, phone: FiPhone,
  mail: FiMail, pin: FiMapPin, image: FiImage, upload: FiUpload, save: FiSave, alert: FiAlertCircle, info: FiInfo,
  dollar: FiDollarSign, refresh: FiRefreshCw, external: FiExternalLink, card: FiCreditCard, clock: FiClock, sliders: FiSliders,
  'check-circle': FiCheckCircle, 'x-circle': FiXCircle, bag: FiShoppingBag, trend: FiTrendingUp, gift: FiGift,
  facebook: FiFacebook, instagram: FiInstagram, twitter: FiTwitter, youtube: FiYoutube, lock: FiLock, layers: FiLayers,
  repeat: FiRepeat, reply: FiCornerDownRight, more: FiMoreVertical, list: FiList, activity: FiActivity, thumbs: FiThumbsUp, clipboard: FiClipboard,
};

export default function Icon({ name, size = 20, className = '', title, ...rest }) {
  const Component = ICONS[name];
  if (!Component) return null;
  return <Component size={size} className={`icon ${className}`} aria-hidden={title ? undefined : true} title={title} focusable="false" {...rest} />;
}
