import { en } from './en';

export const bn: typeof en = {
  ...en,
  common: {
    ...en.common,
    appName: "স্বাস্থ্যসেবা ট্রায়াজ সহকারী",
    tagline: "মানব-পর্যবেক্ষিত স্বাস্থ্যসেবা সিদ্ধান্ত-সহায়তা প্ল্যাটফর্ম",
    login: "লগ ইন করুন",
    register: "নিবন্ধন করুন",
    logout: "সাইন আউট",
    languageSelect: "ভাষা",
    selectLanguage: "ভাষা নির্বাচন করুন",
  },
  landing: {
    ...en.landing,
    heroTitle: "ভারত-অনুকূল স্বাস্থ্যসেবা ট্রায়াজ সহকারী",
    heroSubtitle: "সরকারি হাসপাতাল, প্রাথমিক স্বাস্থ্যকেন্দ্র এবং কমিউনিটি ক্লিনিকের জন্য তৈরি সিদ্ধান্ত-সহায়তা ব্যবস্থা।",
  }
};
