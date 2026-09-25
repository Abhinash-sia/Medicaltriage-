import { SupportedLanguage } from '../config';
import { en } from './en';
import { hi } from './hi';
import { or } from './or';
import { bn } from './bn';
import { ta, te, mr, kn, ml, pa, gu } from './regional';

export const dictionaries: Record<SupportedLanguage, typeof en> = {
  en,
  hi,
  or,
  bn,
  ta,
  te,
  mr,
  kn,
  ml,
  pa,
  gu,
};

export { en };
