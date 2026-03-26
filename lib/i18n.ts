/**
 * i18n — lightweight translation system.
 * Stores language choice in localStorage.
 * All UI text lives here — no external deps needed.
 */

export type Lang = "en" | "hi" | "kn" | "bn" | "te" | "ur";

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English",  native: "English"  },
  { code: "hi", label: "Hindi",    native: "हिन्दी"    },
  { code: "kn", label: "Kannada",  native: "ಕನ್ನಡ"    },
  { code: "bn", label: "Bengali",  native: "বাংলা"    },
  { code: "te", label: "Telugu",   native: "తెలుగు"   },
  { code: "ur", label: "Urdu",     native: "اردو"     },
];

export type TranslationKey =
  | "appName" | "tagline" | "sosButton" | "sosRecording" | "sosSending"
  | "sosSent" | "sosError" | "sosOffline" | "liveLocation" | "gettingLocation"
  | "openMaps" | "emergencyNumbers" | "tapToCall" | "selfDefense" | "safetyGear"
  | "getExcuse" | "fakeCall" | "smartExcuse" | "generateExcuse" | "yourExcuse"
  | "copy" | "quickExcuses" | "statusSafe" | "statusCaution" | "statusDanger"
  | "syncAlerts" | "signOut" | "backToCalc" | "aiChatbot" | "typeMessage"
  | "send" | "safetyAdvice" | "nearbyResources" | "police" | "hospital"
  | "pharmacy" | "govtOffice" | "loadingMap" | "filterAll" | "recordingEvidence"
  | "stopRecording" | "dataSent" | "meshSending" | "meshDelivered" | "language"
  | "home" | "emergency" | "defense" | "shop" | "excuse" | "chat" | "map";

type Translations = Record<TranslationKey, string>;

const T: Record<Lang, Translations> = {
  en: {
    appName: "Raksha", tagline: "Your silent guardian",
    sosButton: "SOS", sosRecording: "Recording…", sosSending: "Sending…",
    sosSent: "SOS Sent ✓", sosError: "Error — check permissions", sosOffline: "Saved offline",
    liveLocation: "Live Location", gettingLocation: "Getting location…",
    openMaps: "Open in Google Maps ↗", emergencyNumbers: "Emergency Numbers",
    tapToCall: "Tap to call instantly", selfDefense: "Self Defense Videos",
    safetyGear: "Safety Equipment", getExcuse: "Get Excuse", fakeCall: "Fake Call",
    smartExcuse: "Smart Excuse Generator", generateExcuse: "Generate Excuse 🤖",
    yourExcuse: "Your Safe Excuse:", copy: "📋 Copy", quickExcuses: "Quick Excuses",
    statusSafe: "SAFE", statusCaution: "CAUTION", statusDanger: "DANGER",
    syncAlerts: "Sync", signOut: "Sign Out", backToCalc: "← Back to Calculator",
    aiChatbot: "AI Safety Assistant", typeMessage: "Ask for safety advice…",
    send: "Send", safetyAdvice: "Safety Advice",
    nearbyResources: "Nearby Resources", police: "Police", hospital: "Hospital",
    pharmacy: "Pharmacy", govtOffice: "Govt Office", loadingMap: "Loading map…",
    filterAll: "All", recordingEvidence: "🔴 Recording evidence…",
    stopRecording: "Stop Recording", dataSent: "Data sent successfully ✓",
    meshSending: "Sending via nearby devices…", meshDelivered: "Delivered via mesh",
    language: "Language", home: "🏠 Home", emergency: "🆘 Call",
    defense: "🎥 Defense", shop: "🛒 Shop", excuse: "🤖 Excuse",
    chat: "💬 Chat", map: "🗺️ Map",
  },
  hi: {
    appName: "रक्षा", tagline: "आपका मूक संरक्षक",
    sosButton: "SOS", sosRecording: "रिकॉर्डिंग…", sosSending: "भेज रहे हैं…",
    sosSent: "SOS भेजा ✓", sosError: "त्रुटि — अनुमति जांचें", sosOffline: "ऑफलाइन सहेजा",
    liveLocation: "लाइव स्थान", gettingLocation: "स्थान प्राप्त हो रहा है…",
    openMaps: "Google Maps में खोलें ↗", emergencyNumbers: "आपातकालीन नंबर",
    tapToCall: "तुरंत कॉल करने के लिए टैप करें", selfDefense: "आत्मरक्षा वीडियो",
    safetyGear: "सुरक्षा उपकरण", getExcuse: "बहाना पाएं", fakeCall: "नकली कॉल",
    smartExcuse: "स्मार्ट बहाना जनरेटर", generateExcuse: "बहाना बनाएं 🤖",
    yourExcuse: "आपका सुरक्षित बहाना:", copy: "📋 कॉपी", quickExcuses: "त्वरित बहाने",
    statusSafe: "सुरक्षित", statusCaution: "सावधान", statusDanger: "खतरा",
    syncAlerts: "सिंक", signOut: "साइन आउट", backToCalc: "← कैलकुलेटर पर वापस",
    aiChatbot: "AI सुरक्षा सहायक", typeMessage: "सुरक्षा सलाह पूछें…",
    send: "भेजें", safetyAdvice: "सुरक्षा सलाह",
    nearbyResources: "नजदीकी संसाधन", police: "पुलिस", hospital: "अस्पताल",
    pharmacy: "फार्मेसी", govtOffice: "सरकारी कार्यालय", loadingMap: "मानचित्र लोड हो रहा है…",
    filterAll: "सभी", recordingEvidence: "🔴 साक्ष्य रिकॉर्ड हो रहा है…",
    stopRecording: "रिकॉर्डिंग बंद करें", dataSent: "डेटा सफलतापूर्वक भेजा गया ✓",
    meshSending: "नजदीकी डिवाइस से भेज रहे हैं…", meshDelivered: "मेश के जरिए पहुंचाया",
    language: "भाषा", home: "🏠 होम", emergency: "🆘 कॉल",
    defense: "🎥 रक्षा", shop: "🛒 दुकान", excuse: "🤖 बहाना",
    chat: "💬 चैट", map: "🗺️ नक्शा",
  },
  kn: {
    appName: "ರಕ್ಷಾ", tagline: "ನಿಮ್ಮ ಮೌನ ರಕ್ಷಕ",
    sosButton: "SOS", sosRecording: "ರೆಕಾರ್ಡಿಂಗ್…", sosSending: "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…",
    sosSent: "SOS ಕಳುಹಿಸಲಾಗಿದೆ ✓", sosError: "ದೋಷ — ಅನುಮತಿ ಪರಿಶೀಲಿಸಿ", sosOffline: "ಆಫ್‌ಲೈನ್ ಉಳಿಸಲಾಗಿದೆ",
    liveLocation: "ನೇರ ಸ್ಥಳ", gettingLocation: "ಸ್ಥಳ ಪಡೆಯಲಾಗುತ್ತಿದೆ…",
    openMaps: "Google Maps ನಲ್ಲಿ ತೆರೆಯಿರಿ ↗", emergencyNumbers: "ತುರ್ತು ಸಂಖ್ಯೆಗಳು",
    tapToCall: "ತಕ್ಷಣ ಕರೆ ಮಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ", selfDefense: "ಸ್ವರಕ್ಷಣೆ ವೀಡಿಯೊಗಳು",
    safetyGear: "ಸುರಕ್ಷತಾ ಸಾಧನಗಳು", getExcuse: "ನೆಪ ಪಡೆಯಿರಿ", fakeCall: "ನಕಲಿ ಕರೆ",
    smartExcuse: "ಸ್ಮಾರ್ಟ್ ನೆಪ ಜನರೇಟರ್", generateExcuse: "ನೆಪ ರಚಿಸಿ 🤖",
    yourExcuse: "ನಿಮ್ಮ ಸುರಕ್ಷಿತ ನೆಪ:", copy: "📋 ನಕಲಿಸಿ", quickExcuses: "ತ್ವರಿತ ನೆಪಗಳು",
    statusSafe: "ಸುರಕ್ಷಿತ", statusCaution: "ಎಚ್ಚರಿಕೆ", statusDanger: "ಅಪಾಯ",
    syncAlerts: "ಸಿಂಕ್", signOut: "ಸೈನ್ ಔಟ್", backToCalc: "← ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    aiChatbot: "AI ಸುರಕ್ಷತಾ ಸಹಾಯಕ", typeMessage: "ಸುರಕ್ಷತಾ ಸಲಹೆ ಕೇಳಿ…",
    send: "ಕಳುಹಿಸಿ", safetyAdvice: "ಸುರಕ್ಷತಾ ಸಲಹೆ",
    nearbyResources: "ಹತ್ತಿರದ ಸಂಪನ್ಮೂಲಗಳು", police: "ಪೊಲೀಸ್", hospital: "ಆಸ್ಪತ್ರೆ",
    pharmacy: "ಔಷಧಾಲಯ", govtOffice: "ಸರ್ಕಾರಿ ಕಚೇರಿ", loadingMap: "ನಕ್ಷೆ ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
    filterAll: "ಎಲ್ಲಾ", recordingEvidence: "🔴 ಸಾಕ್ಷ್ಯ ರೆಕಾರ್ಡ್ ಆಗುತ್ತಿದೆ…",
    stopRecording: "ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಿ", dataSent: "ಡೇಟಾ ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ ✓",
    meshSending: "ಹತ್ತಿರದ ಸಾಧನಗಳ ಮೂಲಕ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…", meshDelivered: "ಮೆಶ್ ಮೂಲಕ ತಲುಪಿಸಲಾಗಿದೆ",
    language: "ಭಾಷೆ", home: "🏠 ಮನೆ", emergency: "🆘 ಕರೆ",
    defense: "🎥 ರಕ್ಷಣೆ", shop: "🛒 ಅಂಗಡಿ", excuse: "🤖 ನೆಪ",
    chat: "💬 ಚಾಟ್", map: "🗺️ ನಕ್ಷೆ",
  },
  bn: {
    appName: "রক্ষা", tagline: "আপনার নীরব অভিভাবক",
    sosButton: "SOS", sosRecording: "রেকর্ডিং…", sosSending: "পাঠানো হচ্ছে…",
    sosSent: "SOS পাঠানো হয়েছে ✓", sosError: "ত্রুটি — অনুমতি পরীক্ষা করুন", sosOffline: "অফলাইনে সংরক্ষিত",
    liveLocation: "লাইভ অবস্থান", gettingLocation: "অবস্থান পাওয়া যাচ্ছে…",
    openMaps: "Google Maps-এ খুলুন ↗", emergencyNumbers: "জরুরি নম্বর",
    tapToCall: "তাৎক্ষণিক কল করতে ট্যাপ করুন", selfDefense: "আত্মরক্ষা ভিডিও",
    safetyGear: "নিরাপত্তা সরঞ্জাম", getExcuse: "অজুহাত পান", fakeCall: "নকল কল",
    smartExcuse: "স্মার্ট অজুহাত জেনারেটর", generateExcuse: "অজুহাত তৈরি করুন 🤖",
    yourExcuse: "আপনার নিরাপদ অজুহাত:", copy: "📋 কপি", quickExcuses: "দ্রুত অজুহাত",
    statusSafe: "নিরাপদ", statusCaution: "সতর্কতা", statusDanger: "বিপদ",
    syncAlerts: "সিঙ্ক", signOut: "সাইন আউট", backToCalc: "← ক্যালকুলেটরে ফিরুন",
    aiChatbot: "AI নিরাপত্তা সহকারী", typeMessage: "নিরাপত্তা পরামর্শ জিজ্ঞাসা করুন…",
    send: "পাঠান", safetyAdvice: "নিরাপত্তা পরামর্শ",
    nearbyResources: "কাছের সম্পদ", police: "পুলিশ", hospital: "হাসপাতাল",
    pharmacy: "ফার্মেসি", govtOffice: "সরকারি অফিস", loadingMap: "মানচিত্র লোড হচ্ছে…",
    filterAll: "সব", recordingEvidence: "🔴 প্রমাণ রেকর্ড হচ্ছে…",
    stopRecording: "রেকর্ডিং বন্ধ করুন", dataSent: "ডেটা সফলভাবে পাঠানো হয়েছে ✓",
    meshSending: "কাছের ডিভাইসের মাধ্যমে পাঠানো হচ্ছে…", meshDelivered: "মেশের মাধ্যমে পৌঁছে দেওয়া হয়েছে",
    language: "ভাষা", home: "🏠 হোম", emergency: "🆘 কল",
    defense: "🎥 প্রতিরক্ষা", shop: "🛒 দোকান", excuse: "🤖 অজুহাত",
    chat: "💬 চ্যাট", map: "🗺️ মানচিত্র",
  },
  te: {
    appName: "రక్ష", tagline: "మీ మౌన సంరక్షకుడు",
    sosButton: "SOS", sosRecording: "రికార్డింగ్…", sosSending: "పంపుతున్నాం…",
    sosSent: "SOS పంపబడింది ✓", sosError: "లోపం — అనుమతులు తనిఖీ చేయండి", sosOffline: "ఆఫ్‌లైన్‌లో సేవ్ చేయబడింది",
    liveLocation: "లైవ్ లొకేషన్", gettingLocation: "లొకేషన్ పొందుతున్నాం…",
    openMaps: "Google Maps లో తెరవండి ↗", emergencyNumbers: "అత్యవసర నంబర్లు",
    tapToCall: "వెంటనే కాల్ చేయడానికి నొక్కండి", selfDefense: "స్వరక్షణ వీడియోలు",
    safetyGear: "భద్రతా పరికరాలు", getExcuse: "సాకు పొందండి", fakeCall: "నకిలీ కాల్",
    smartExcuse: "స్మార్ట్ సాకు జనరేటర్", generateExcuse: "సాకు రూపొందించండి 🤖",
    yourExcuse: "మీ సురక్షిత సాకు:", copy: "📋 కాపీ", quickExcuses: "త్వరిత సాకులు",
    statusSafe: "సురక్షితం", statusCaution: "జాగ్రత్త", statusDanger: "ప్రమాదం",
    syncAlerts: "సింక్", signOut: "సైన్ అవుట్", backToCalc: "← కాల్క్యులేటర్‌కు తిరిగి",
    aiChatbot: "AI భద్రతా సహాయకుడు", typeMessage: "భద్రతా సలహా అడగండి…",
    send: "పంపండి", safetyAdvice: "భద్రతా సలహా",
    nearbyResources: "సమీప వనరులు", police: "పోలీసు", hospital: "ఆసుపత్రి",
    pharmacy: "ఫార్మసీ", govtOffice: "ప్రభుత్వ కార్యాలయం", loadingMap: "మ్యాప్ లోడ్ అవుతోంది…",
    filterAll: "అన్నీ", recordingEvidence: "🔴 సాక్ష్యం రికార్డ్ అవుతోంది…",
    stopRecording: "రికార్డింగ్ ఆపండి", dataSent: "డేటా విజయవంతంగా పంపబడింది ✓",
    meshSending: "సమీప పరికరాల ద్వారా పంపుతున్నాం…", meshDelivered: "మెష్ ద్వారా డెలివరీ అయింది",
    language: "భాష", home: "🏠 హోమ్", emergency: "🆘 కాల్",
    defense: "🎥 రక్షణ", shop: "🛒 షాప్", excuse: "🤖 సాకు",
    chat: "💬 చాట్", map: "🗺️ మ్యాప్",
  },
  ur: {
    appName: "رکشا", tagline: "آپ کا خاموش محافظ",
    sosButton: "SOS", sosRecording: "ریکارڈنگ…", sosSending: "بھیج رہے ہیں…",
    sosSent: "SOS بھیجا گیا ✓", sosError: "خرابی — اجازتیں چیک کریں", sosOffline: "آف لائن محفوظ",
    liveLocation: "لائیو مقام", gettingLocation: "مقام حاصل ہو رہا ہے…",
    openMaps: "Google Maps میں کھولیں ↗", emergencyNumbers: "ہنگامی نمبر",
    tapToCall: "فوری کال کے لیے ٹیپ کریں", selfDefense: "خود دفاعی ویڈیوز",
    safetyGear: "حفاظتی سامان", getExcuse: "بہانہ حاصل کریں", fakeCall: "جھوٹی کال",
    smartExcuse: "سمارٹ بہانہ جنریٹر", generateExcuse: "بہانہ بنائیں 🤖",
    yourExcuse: "آپ کا محفوظ بہانہ:", copy: "📋 کاپی", quickExcuses: "فوری بہانے",
    statusSafe: "محفوظ", statusCaution: "احتیاط", statusDanger: "خطرہ",
    syncAlerts: "سنک", signOut: "سائن آؤٹ", backToCalc: "← کیلکولیٹر پر واپس",
    aiChatbot: "AI حفاظتی معاون", typeMessage: "حفاظتی مشورہ پوچھیں…",
    send: "بھیجیں", safetyAdvice: "حفاظتی مشورہ",
    nearbyResources: "قریبی وسائل", police: "پولیس", hospital: "ہسپتال",
    pharmacy: "فارمیسی", govtOffice: "سرکاری دفتر", loadingMap: "نقشہ لوڈ ہو رہا ہے…",
    filterAll: "سب", recordingEvidence: "🔴 ثبوت ریکارڈ ہو رہا ہے…",
    stopRecording: "ریکارڈنگ روکیں", dataSent: "ڈیٹا کامیابی سے بھیجا گیا ✓",
    meshSending: "قریبی آلات کے ذریعے بھیج رہے ہیں…", meshDelivered: "میش کے ذریعے پہنچایا گیا",
    language: "زبان", home: "🏠 ہوم", emergency: "🆘 کال",
    defense: "🎥 دفاع", shop: "🛒 دکان", excuse: "🤖 بہانہ",
    chat: "💬 چیٹ", map: "🗺️ نقشہ",
  },
};

export function t(lang: Lang, key: TranslationKey): string {
  return T[lang]?.[key] ?? T.en[key] ?? key;
}

export function getSavedLang(): Lang {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem("raksha_lang") as Lang) || "en";
}

export function saveLang(lang: Lang) {
  localStorage.setItem("raksha_lang", lang);
}
