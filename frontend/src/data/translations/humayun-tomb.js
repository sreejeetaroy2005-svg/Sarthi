/**
 * Translations for Humayun's Tomb — Hindi, Tamil, Bengali.
 *
 * Every translated string is marked with a TRANSLATION-REVIEW comment
 * so a native speaker can find and verify it.
 *
 * Structure mirrors the English data in monuments.js:
 *   { [langCode]: { chapters: [...], questions: [...] } }
 */

const humayunTombTranslations = {
  hi: {
    chapters: [
      {
        id: 'ch1',
        title: 'पश्चिमी द्वार प्रवेश', // TRANSLATION-REVIEW: Hindi chapter 1 title
        // TRANSLATION-REVIEW: Hindi chapter 1 transcript
        transcript:
          'हुमायूँ के मकबरे में आपका स्वागत है। जैसे ही आप 16 मीटर ऊँचे विशाल पश्चिमी द्वार से प्रवेश करते हैं, ध्यान दीजिए कि केंद्रीय मेहराब कैसे दूर स्थित लाल बलुआ पत्थर के गुंबद को पूरी तरह फ्रेम करता है।',
      },
      {
        id: 'ch2',
        title: 'चारबाग उद्यान', // TRANSLATION-REVIEW: Hindi chapter 2 title
        // TRANSLATION-REVIEW: Hindi chapter 2 transcript
        transcript:
          'आप चारबाग में चल रहे हैं — यह एक चतुर्भुज उद्यान है जो शास्त्रीय साहित्य में वर्णित स्वर्ग के चार बगीचों पर आधारित है। जलमार्ग बगीचे को 36 सटीक वर्गों में विभाजित करते हैं।',
      },
      {
        id: 'ch3',
        title: 'ऊँचा चबूतरा और दोहरा गुंबद', // TRANSLATION-REVIEW: Hindi chapter 3 title
        // TRANSLATION-REVIEW: Hindi chapter 3 transcript
        transcript:
          'केंद्रीय चबूतरे पर चढ़ें। ऊपर दोहरे गुंबद को ध्यान से देखें। बाहरी सतह 42 मीटर ऊँची है, शुद्ध सफेद राजस्थानी संगमरमर से ढकी है, जबकि भीतरी छत मानव पैमाने के अनुरूप है।',
      },
      {
        id: 'ch4',
        title: 'नाई का मकबरा और ईसा खान परिसर', // TRANSLATION-REVIEW: Hindi chapter 4 title
        // TRANSLATION-REVIEW: Hindi chapter 4 transcript
        transcript:
          'मुख्य मकबरे के ठीक दक्षिण में ईसा खान नियाज़ी का अष्टकोणीय मकबरा है, जो हुमायूँ के मकबरे से 20 साल पहले सूरी वंश के दौरान बनाया गया था।',
      },
    ],
    questions: [
      {
        // TRANSLATION-REVIEW: Hindi Q&A — red sandstone
        q: 'यह लाल बलुआ पत्थर से क्यों बना है?',
        a: 'लाल बलुआ पत्थर राजस्थान से लाया गया था, जो शाही भव्यता और शक्ति का प्रतीक है। सफेद संगमरमर आध्यात्मिक पवित्रता को दर्शाता है।',
        // Keywords for matching (keep in both Hindi and transliterated forms)
        keywords: ['लाल', 'बलुआ', 'पत्थर', 'sandstone', 'red', 'लाल बलुआ'],
      },
      {
        // TRANSLATION-REVIEW: Hindi Q&A — main entrance
        q: 'मुख्य प्रवेश द्वार कहाँ है?',
        a: 'मुख्य प्रवेश द्वार पश्चिमी द्वार है जहाँ से आपने प्रवेश किया। एक दक्षिणी द्वार भी है, जो परंपरागत रूप से शाही परिवार के लिए आरक्षित था।',
        keywords: ['प्रवेश', 'द्वार', 'entrance', 'gate', 'दरवाज़ा'],
      },
      {
        // TRANSLATION-REVIEW: Hindi Q&A — who is buried
        q: 'मुख्य कक्ष में कौन दफ़न है?',
        a: 'केंद्रीय कक्ष में सम्राट हुमायूँ की समाधि है। आसपास के कक्षों में उनकी पत्नियों और बाद के मुगल राजकुमारों की कब्रें हैं।',
        keywords: ['दफ़न', 'कब्र', 'समाधि', 'buried', 'tomb', 'grave', 'कौन'],
      },
      {
        // TRANSLATION-REVIEW: Hindi Q&A — Taj Mahal connection
        q: 'ताजमहल से इसका क्या संबंध है?',
        a: 'यह ताजमहल का सीधा वास्तुशिल्प प्रोटोटाइप है। दोहरे गुंबद और चारबाग उद्यानों को 60 साल बाद शाहजहाँ ने बड़े पैमाने पर बनवाया।',
        keywords: ['ताजमहल', 'ताज', 'taj', 'mahal', 'संबंध', 'connection'],
      },
    ],
  },

  ta: {
    chapters: [
      {
        id: 'ch1',
        title: 'மேற்கு நுழைவாயில்', // TRANSLATION-REVIEW: Tamil chapter 1 title
        // TRANSLATION-REVIEW: Tamil chapter 1 transcript
        transcript:
          'ஹுமாயூன் கல்லறைக்கு வரவேற்கிறோம். 16 மீட்டர் உயர மேற்கு நுழைவாயில் வழியாக நுழையும்போது, மையத்திலுள்ள வளைவு தொலைவிலுள்ள சிவப்பு மணற்கல் குடும்பத்தை எவ்வாறு சரியாக பிரேம் செய்கிறது என்பதைக் கவனியுங்கள்.',
      },
      {
        id: 'ch2',
        title: 'சார்பாக் தோட்டங்கள்', // TRANSLATION-REVIEW: Tamil chapter 2 title
        // TRANSLATION-REVIEW: Tamil chapter 2 transcript
        transcript:
          'நீங்கள் சார்பாக்கில் நடந்து கொண்டிருக்கிறீர்கள் — இது செவ்வக தோட்ட அமைப்பு. பாரம்பரிய இலக்கியத்தில் விவரிக்கப்பட்ட சொர்க்கத்தின் நான்கு தோட்டங்களை அடிப்படையாகக் கொண்டது. நீர்வழிகள் தோட்டத்தை 36 சதுரங்களாகப் பிரிக்கின்றன.',
      },
      {
        id: 'ch3',
        title: 'உயர் மேடை மற்றும் இரட்டைக் குவிமாடம்', // TRANSLATION-REVIEW: Tamil chapter 3 title
        // TRANSLATION-REVIEW: Tamil chapter 3 transcript
        transcript:
          'மையத் திண்ணையில் ஏறுங்கள். உங்களுக்கு மேலே உள்ள இரட்டைக் குவிமாடத்தை கவனமாகப் பாருங்கள். வெளிப்புற குவிமாடம் 42 மீட்டர் உயரத்தில், சுத்தமான வெள்ளை ராஜஸ்தானி பளிங்குக் கல்லால் மூடப்பட்டுள்ளது.',
      },
      {
        id: 'ch4',
        title: 'நாவிதரின் கல்லறை மற்றும் ஈசா கான் வளாகம்', // TRANSLATION-REVIEW: Tamil chapter 4 title
        // TRANSLATION-REVIEW: Tamil chapter 4 transcript
        transcript:
          'பிரதான கல்லறையின் தெற்கே ஈசா கான் நியாசியின் எண்கோண கல்லறை உள்ளது, இது ஹுமாயூன் கல்லறைக்கு 20 ஆண்டுகளுக்கு முன் சூரி வம்சத்தின் போது கட்டப்பட்டது.',
      },
    ],
    questions: [
      {
        // TRANSLATION-REVIEW: Tamil Q&A — red sandstone
        q: 'ஏன் சிவப்பு மணற்கல்லால் கட்டப்பட்டது?',
        a: 'சிவப்பு மணற்கல் ராஜஸ்தானிலிருந்து கொண்டு வரப்பட்டது, இது அரச மகிமையையும் அதிகாரத்தையும் குறிக்கிறது. வெள்ளை பளிங்கு ஆன்மீக தூய்மையைக் குறிக்கிறது.',
        keywords: ['சிவப்பு', 'மணற்கல்', 'sandstone', 'red', 'கல்'],
      },
      {
        // TRANSLATION-REVIEW: Tamil Q&A — main entrance
        q: 'முக்கிய நுழைவாயில் எங்கே?',
        a: 'முக்கிய நுழைவாயில் மேற்கு வாயில் ஆகும். தெற்கு வாயிலும் உள்ளது, அது அரச குடும்பத்திற்காக ஒதுக்கப்பட்டிருந்தது.',
        keywords: ['நுழைவாயில்', 'வாயில்', 'entrance', 'gate', 'எங்கே'],
      },
      {
        // TRANSLATION-REVIEW: Tamil Q&A — who is buried
        q: 'முக்கிய அறையில் யார் அடக்கம் செய்யப்பட்டிருக்கிறார்?',
        a: 'மையத் துறையில் பேரரசர் ஹுமாயூனின் நினைவுக் கல்லறை உள்ளது. சுற்றியுள்ள அறைகளில் அவரது மனைவிகள் மற்றும் பிற்கால முகலாய இளவரசர்களின் கல்லறைகள் உள்ளன.',
        keywords: ['அடக்கம்', 'கல்லறை', 'buried', 'tomb', 'யார்'],
      },
      {
        // TRANSLATION-REVIEW: Tamil Q&A — Taj Mahal connection
        q: 'தாஜ்மஹாலுடன் என்ன தொடர்பு?',
        a: 'இது தாஜ்மஹாலின் நேரடி கட்டடக்கலை முன்மாதிரி. இரட்டைக் குவிமாடம் மற்றும் சார்பாக் தோட்டங்கள் 60 ஆண்டுகளுக்குப் பிறகு ஷாஜஹானால் பெரிய அளவில் கட்டப்பட்டன.',
        keywords: ['தாஜ்மஹால்', 'தாஜ்', 'taj', 'mahal', 'தொடர்பு'],
      },
    ],
  },

  bn: {
    chapters: [
      {
        id: 'ch1',
        title: 'পশ্চিম দ্বার প্রবেশ', // TRANSLATION-REVIEW: Bengali chapter 1 title
        // TRANSLATION-REVIEW: Bengali chapter 1 transcript
        transcript:
          'হুমায়ুনের সমাধিতে আপনাকে স্বাগতম। ১৬ মিটার উঁচু বিশাল পশ্চিম দ্বার দিয়ে প্রবেশ করার সময় লক্ষ্য করুন কেন্দ্রীয় খিলান কীভাবে দূরের লাল বেলেপাথরের গম্বুজকে পুরোপুরি ফ্রেম করে।',
      },
      {
        id: 'ch2',
        title: 'চারবাগ উদ্যান', // TRANSLATION-REVIEW: Bengali chapter 2 title
        // TRANSLATION-REVIEW: Bengali chapter 2 transcript
        transcript:
          'আপনি চারবাগে হাঁটছেন — এটি একটি চতুষ্কোণ বাগান বিন্যাস যা ধ্রুপদী সাহিত্যে বর্ণিত স্বর্গের চারটি বাগানের ওপর ভিত্তি করে তৈরি। জলপথগুলি বাগানটিকে ৩৬টি সুষম বর্গক্ষেত্রে বিভক্ত করে।',
      },
      {
        id: 'ch3',
        title: 'উঁচু মঞ্চ ও দ্বৈত গম্বুজ', // TRANSLATION-REVIEW: Bengali chapter 3 title
        // TRANSLATION-REVIEW: Bengali chapter 3 transcript
        transcript:
          'কেন্দ্রীয় মঞ্চে উঠুন। আপনার উপরের দ্বৈত গম্বুজটি মনোযোগ দিয়ে দেখুন। বাইরের আবরণ ৪২ মিটার উঁচু, বিশুদ্ধ সাদা রাজস্থানী মার্বেল দিয়ে মোড়া, আর ভেতরের ছাদ মানবিক অনুপাতে রাখা হয়েছে।',
      },
      {
        id: 'ch4',
        title: 'নাপিতের সমাধি ও ঈসা খান চত্বর', // TRANSLATION-REVIEW: Bengali chapter 4 title
        // TRANSLATION-REVIEW: Bengali chapter 4 transcript
        transcript:
          'মূল সমাধির ঠিক দক্ষিণে ঈসা খান নিয়াজির অষ্টভুজাকৃতি সমাধি রয়েছে, যা হুমায়ুনের সমাধির ২০ বছর আগে সুরি রাজবংশের সময় নির্মিত হয়েছিল।',
      },
    ],
    questions: [
      {
        // TRANSLATION-REVIEW: Bengali Q&A — red sandstone
        q: 'এটি লাল বেলেপাথরে কেন তৈরি?',
        a: 'লাল বেলেপাথর রাজস্থান থেকে আনা হয়েছিল, যা রাজকীয় মহিমা ও ক্ষমতার প্রতীক। সাদা মার্বেল আধ্যাত্মিক পবিত্রতা বোঝায়।',
        keywords: ['লাল', 'বেলেপাথর', 'পাথর', 'sandstone', 'red'],
      },
      {
        // TRANSLATION-REVIEW: Bengali Q&A — main entrance
        q: 'মূল প্রবেশদ্বার কোথায়?',
        a: 'মূল প্রবেশদ্বার হলো পশ্চিম দ্বার যেখান দিয়ে আপনি প্রবেশ করেছেন। একটি দক্ষিণ দ্বারও আছে, যা ঐতিহ্যগতভাবে রাজপরিবারের জন্য সংরক্ষিত ছিল।',
        keywords: ['প্রবেশদ্বার', 'দ্বার', 'entrance', 'gate', 'কোথায়'],
      },
      {
        // TRANSLATION-REVIEW: Bengali Q&A — who is buried
        q: 'প্রধান কক্ষে কে সমাহিত আছেন?',
        a: 'কেন্দ্রীয় কক্ষে সম্রাট হুমায়ুনের সমাধি রয়েছে। পার্শ্ববর্তী কক্ষগুলিতে তাঁর স্ত্রীদের ও পরবর্তী মুঘল রাজপুত্রদের কবর আছে।',
        keywords: ['সমাহিত', 'কবর', 'সমাধি', 'buried', 'tomb', 'কে'],
      },
      {
        // TRANSLATION-REVIEW: Bengali Q&A — Taj Mahal connection
        q: 'তাজমহলের সঙ্গে এর সম্পর্ক কী?',
        a: 'এটি তাজমহলের সরাসরি স্থাপত্যের আদিরূপ। দ্বৈত গম্বুজ ও চারবাগ উদ্যানগুলি ৬০ বছর পরে শাহজাহান আরও বড় পরিসরে তৈরি করেছিলেন।',
        keywords: ['তাজমহল', 'তাজ', 'taj', 'mahal', 'সম্পর্ক'],
      },
    ],
  },
};

export default humayunTombTranslations;

