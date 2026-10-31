/**
 * Translations for Red Fort (Lal Qila) — Hindi, Tamil, Bengali.
 *
 * Every translated string is marked with a TRANSLATION-REVIEW comment
 * so a native speaker can find and verify it.
 *
 * Structure mirrors the English data in monuments.js:
 *   { [langCode]: { chapters: [...], questions: [...] } }
 */

const redFortTranslations = {
  hi: {
    chapters: [
      {
        id: 'rf1',
        title: 'लाहौरी गेट प्रवेश', // TRANSLATION-REVIEW: Hindi chapter 1 title
        // TRANSLATION-REVIEW: Hindi chapter 1 transcript
        transcript:
          'लाहौरी गेट में आपका स्वागत है, यह लाल किले का मुख्य प्रवेश द्वार है जो पुरानी दिल्ली की ओर मुख किए हुए है। सफ़ेद संगमरमर की छतरियों से सजे भव्य अष्टकोणीय बुर्जों को देखें।',
      },
    ],
    questions: [
      {
        // TRANSLATION-REVIEW: Hindi Q&A — Diwan-i-Khas
        q: 'दीवान-ए-ख़ास क्या है?',
        a: 'दीवान-ए-ख़ास निजी दर्शकों का हॉल था, जहाँ कभी प्रसिद्ध मयूर सिंहासन रखा था और जिस पर लिखा है — "अगर धरती पर कहीं जन्नत है, तो यहीं है, यहीं है, यहीं है"।',
        keywords: ['दीवान', 'ख़ास', 'khas', 'diwan', 'हॉल'],
      },
      {
        // TRANSLATION-REVIEW: Hindi Q&A — why called Red Fort
        q: 'इसे लाल किला क्यों कहते हैं?',
        a: 'इसकी विशाल लाल बलुआ पत्थर की दीवारों के कारण जो पुरानी दिल्ली में 2.4 किलोमीटर तक फैली हैं।',
        keywords: ['लाल', 'किला', 'red', 'fort', 'नाम', 'क्यों'],
      },
      {
        // TRANSLATION-REVIEW: Hindi Q&A — when built
        q: 'यह कब बना था?',
        a: 'मुगल सम्राट शाहजहाँ ने 1638 से 1648 के बीच इसका निर्माण कराया, जब उन्होंने अपनी राजधानी आगरा से दिल्ली स्थानांतरित की।',
        keywords: ['कब', 'बना', 'निर्माण', 'built', 'when', 'साल'],
      },
    ],
  },

  ta: {
    chapters: [
      {
        id: 'rf1',
        title: 'லாஹோரி வாயில் நுழைவு', // TRANSLATION-REVIEW: Tamil chapter 1 title
        // TRANSLATION-REVIEW: Tamil chapter 1 transcript
        transcript:
          'செங்கோட்டையின் முக்கிய நுழைவாயிலான லாஹோரி வாயிலுக்கு வரவேற்கிறோம். பழைய டெல்லியை நோக்கியிருக்கும் இது, வெள்ளை பளிங்கு சத்ரிகளால் அலங்கரிக்கப்பட்ட எண்கோண கோபுரங்களைக் கொண்டுள்ளது.',
      },
    ],
    questions: [
      {
        // TRANSLATION-REVIEW: Tamil Q&A — Diwan-i-Khas
        q: 'திவான்-இ-காஸ் என்றால் என்ன?',
        a: 'தனிப்பட்ட பேட்டிக் கூடம், ஒரு காலத்தில் மயில் சிம்மாசனம் இருந்த இடம். "பூமியில் சொர்க்கம் இருந்தால், அது இங்கே, இங்கே, இங்கே" என்ற பாரசீகக் கல்வெட்டுடன் கூடியது.',
        keywords: ['திவான்', 'காஸ்', 'khas', 'diwan', 'கூடம்'],
      },
      {
        // TRANSLATION-REVIEW: Tamil Q&A — why called Red Fort
        q: 'ஏன் செங்கோட்டை என்று அழைக்கப்படுகிறது?',
        a: 'பழைய டெல்லியில் 2.4 கிலோமீட்டர் நீளமுள்ள மிகப்பெரிய சிவப்பு மணற்கல் சுவர்களால் சூழப்பட்டுள்ளதால் இப்பெயர் வந்தது.',
        keywords: ['செங்கோட்டை', 'சிவப்பு', 'red', 'fort', 'ஏன்', 'பெயர்'],
      },
      {
        // TRANSLATION-REVIEW: Tamil Q&A — when built
        q: 'இது எப்போது கட்டப்பட்டது?',
        a: 'முகலாயப் பேரரசர் ஷாஜஹான் 1638 முதல் 1648 வரை கட்டினார், அவர் தலைநகரை ஆக்ராவிலிருந்து டெல்லிக்கு மாற்றியபோது.',
        keywords: ['எப்போது', 'கட்டப்பட்டது', 'built', 'when', 'ஆண்டு'],
      },
    ],
  },

  bn: {
    chapters: [
      {
        id: 'rf1',
        title: 'লাহোরি গেট প্রবেশ', // TRANSLATION-REVIEW: Bengali chapter 1 title
        // TRANSLATION-REVIEW: Bengali chapter 1 transcript
        transcript:
          'লাহোরি গেটে আপনাকে স্বাগতম, এটি লালকেল্লার মূল প্রবেশদ্বার যা পুরনো দিল্লির দিকে মুখ করে আছে। সাদা মার্বেলের ছত্রী দিয়ে সজ্জিত মহিমান্বিত অষ্টভুজাকৃতি বুরুজগুলি দেখুন।',
      },
    ],
    questions: [
      {
        // TRANSLATION-REVIEW: Bengali Q&A — Diwan-i-Khas
        q: 'দিওয়ান-ই-খাস কী?',
        a: 'দিওয়ান-ই-খাস ছিল ব্যক্তিগত দর্শনার্থীদের হল, যেখানে একসময় বিখ্যাত ময়ূর সিংহাসন ছিল এবং লেখা আছে — "পৃথিবীতে যদি স্বর্গ থাকে, তবে এখানেই, এখানেই, এখানেই"।',
        keywords: ['দিওয়ান', 'খাস', 'khas', 'diwan', 'হল'],
      },
      {
        // TRANSLATION-REVIEW: Bengali Q&A — why called Red Fort
        q: 'একে লালকেল্লা বলা হয় কেন?',
        a: 'পুরনো দিল্লিতে ২.৪ কিলোমিটার বিস্তৃত বিশাল লাল বেলেপাথরের দেয়ালের কারণে এই নাম।',
        keywords: ['লাল', 'কেল্লা', 'red', 'fort', 'কেন', 'নাম'],
      },
      {
        // TRANSLATION-REVIEW: Bengali Q&A — when built
        q: 'এটি কবে নির্মিত হয়?',
        a: 'মুঘল সম্রাট শাহজাহান ১৬৩৮ থেকে ১৬৪৮ সালের মধ্যে এটি নির্মাণ করান, যখন তিনি রাজধানী আগ্রা থেকে দিল্লিতে স্থানান্তরিত করেন।',
        keywords: ['কবে', 'নির্মিত', 'built', 'when', 'সাল'],
      },
    ],
  },
};

export default redFortTranslations;

