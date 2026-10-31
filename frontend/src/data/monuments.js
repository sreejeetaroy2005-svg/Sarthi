export const MONUMENTS = [
  {
    id: "humayun-tomb",
    title: "Humayun's Tomb",
    subtitle: "Maqbaera-e-Humayun",
    category: "Heritage",
    categoryColor: "#974730", // Terracotta
    rating: 4.8,
    reviewsCount: 14250,
    distance: "1.2 km",
    city: "New Delhi",
    coords: { lat: 28.5933, lng: 77.2507 },
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1200&auto=format&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1600&auto=format&fit=crop",
    unescoStatus: true,
    builtYear: "1572 AD",
    architect: "Mirak Mirza Ghiyas",
    patron: "Empress Bega Begum",
    architecturalStyle: "Mughal Charbagh Garden Tomb",
    openingHours: "6:00 AM – 6:00 PM (Daily)",
    bestTimeToVisit: "7:30 AM – 10:00 AM (Soft sunrise light)",
    entryFee: "₹40 (Indian Nationals) / ₹600 (Foreign Nationals)",
    avgTimeSpent: "1.5 – 2 Hours",
    shortDescription: "A Mughal garden tomb whose Charbagh layout helped shape later imperial architecture.",
    tags: ["Mughal", "UNESCO", "Garden tomb"],
    visitDuration: 105,
    fee: "₹40 Indian / ₹600 foreign",
    walkingEffort: "moderate",
    seniorFriendly: true,
    kidFriendly: true,
    guidePassPrice: 99,
    overview: "Humayun's Tomb is the magnificent tomb of the second Mughal Emperor, Humayun. Commissioned by his chief consort Bega Begum in 1558 and designed by Persian architects, it stands as the first grand garden-tomb on the Indian subcontinent and the direct architectural precursor to the Taj Mahal.",
    storyContent: {
      headline: "The Grand Prototype of Mughal Architecture",
      intro: "Built 60 years before the Taj Mahal, Humayun's Tomb introduced the Persian Charbagh (four-fold garden) layout to India on a monumental scale.",
      bodyParagraphs: [
        "Following the tragic death of Emperor Humayun in 1556 after falling down his library stairs in Purana Qila, his senior wife Empress Bega Begum (also known as Haji Begum) resolved to build a mausoleum unprecedented in splendour across Islamic Asia.",
        "She brought Persian architect Mirak Mirza Ghiyas from Herat (modern Afghanistan). Ghiyas blended Persian double-dome engineering with indigenous Indian red sandstone carving, creating the iconic Mughal architectural language.",
        "The complex contains over 150 Mughal family graves, earning it the title 'Dormitory of the Mughals'. Here, Bahadur Shah Zafar took refuge in 1857 before his capture by the British."
      ],
      architecturalSecrets: [
        {
          title: "The Double Dome Mechanism",
          desc: "An inner structural ceiling creates proper internal acoustics while the outer marble dome achieves soaring external symmetry (42 meters height)."
        },
        {
          title: "Charbagh Quadrant Geometry",
          desc: "Four main garden quadrants divided by water channels representing the four rivers of Paradise mentioned in Persian poetry."
        },
        {
          title: "Red Sandstone & White Marble",
          desc: "Strict chromatic contrast where red sandstone symbolizes imperial authority while white marble signifies purity."
        }
      ]
    },
    audioChapters: [
      {
        id: "ch1",
        title: "The West Gateway Entry",
        duration: "02:45",
        audioSrc: "",
        transcript: "Welcome to Humayun's Tomb. As you step through the imposing 16-meter West Gateway, notice how the central archway perfectly frames the distant red sandstone dome."
      },
      {
        id: "ch2",
        title: "The Charbagh Gardens",
        duration: "04:15",
        audioSrc: "",
        transcript: "You are walking through the Charbagh, a quadrilateral garden layout based on the four gardens of Paradise described in classical literature. Waterways dissect the garden into 36 precise squares."
      },
      {
        id: "ch3",
        title: "The High Terrace & Double Dome",
        duration: "05:30",
        audioSrc: "",
        transcript: "Ascend the central plinth. Look closely at the double dome above you. The outer skin rises 42 meters high, clad in pure white Rajasthani marble, while the inner ceiling remains proportionate for human scale inside."
      },
      {
        id: "ch4",
        title: "Barber's Tomb & Isa Khan Enclosure",
        duration: "03:10",
        audioSrc: "",
        transcript: "Just south of the main mausoleum lies the octagonal tomb of Isa Khan Niyazi, built 20 years earlier than Humayun's tomb during the Suri Dynasty."
      }
    ],
    keyHighlights: [
      "UNESCO World Heritage Site designated in 1993",
      "First major garden-tomb on the Indian Subcontinent",
      "Direct design inspiration for the Taj Mahal",
      "Contains the tomb of Emperor Humayun & Empress Bega Begum"
    ],
    nearbyDining: [
      { name: "Karim's Nizamuddin", cuisine: "Mughlai", distance: "600m", rating: 4.6, coords: { lat: 28.5895, lng: 77.2508 }, approx: true },
      { name: "Lodi - The Garden Restaurant", cuisine: "European & Mediterranean", distance: "1.4 km", rating: 4.5, coords: { lat: 28.5926, lng: 77.2282 }, approx: true }
    ],
    visitorGuidelines: {
      dressCode: "Wear modest, weather-appropriate clothing. Sarthi's notes do not specify a mandatory dress code; follow any current instructions posted by site staff.",
      footwear: "Comfortable walking shoes are recommended. The garden paths cover a large open-air complex, and the terrace route includes steps.",
      bagsAndCameras: "Bags may be inspected at the entrance. Camera rules and any camera fee can change; check the current ASI notice or ticket counter before entering.",
      security: "Allow time for entry screening and follow instructions from security and monument staff. Do not touch or climb on the monument fabric.",
      ticketCounter: "Entry tickets are separate from a Sarthi Guide Pass. Check current rates and ticket options at the official ASI booking portal or the onsite counter.",
      officialTicketsUrl: "https://asi.paygov.org.in/asi-webapp/#/ticketbooking",
      hours: "The app's current record lists 6:00 AM–6:00 PM daily. Confirm the day's closing time on the official notice at the site.",
      photoSpots: [
        { name: "West Gateway", tip: "The central arch frames a view toward the tomb." },
        { name: "Charbagh garden paths", tip: "Use the garden paths and water-channel lines to frame the mausoleum." },
        { name: "Main tomb terrace", tip: "The terrace gives a close view of the red sandstone and marble details." },
      ],
      notice: "Visitor rules, fees, and opening hours can change. Follow current ASI signage and staff instructions.",
    },
    walkingRoute: [
      {
        id: "west-gateway",
        name: "West Gateway",
        direction: "Begin at the West Gateway and pass through its central arch toward the garden axis.",
        chapterId: "ch1",
        storyChapter: "The West Gateway Entry",
        tip: "Pause under the arch and look along the framed view before moving into the garden.",
      },
      {
        id: "charbagh-gardens",
        name: "Charbagh Gardens",
        direction: "Continue along the garden paths toward the mausoleum, following the water-channel lines through the Charbagh.",
        chapterId: "ch2",
        storyChapter: "The Charbagh Gardens",
        tip: "Stay on the marked paths and give other visitors room around the channels.",
      },
      {
        id: "main-terrace",
        name: "High Terrace and Double Dome",
        direction: "Follow the approach to the main tomb, then use the visitor steps to reach the central terrace.",
        chapterId: "ch3",
        storyChapter: "The High Terrace & Double Dome",
        tip: "Take the steps at an easy pace; pause at the terrace to view the dome and stonework.",
      },
      {
        id: "isa-khan-enclosure",
        name: "Isa Khan Enclosure",
        direction: "From the main mausoleum, follow the signed garden route toward the Isa Khan enclosure.",
        chapterId: "ch4",
        storyChapter: "Barber's Tomb & Isa Khan Enclosure",
        tip: "This enclosure has its own historic setting. Keep voices low and respect people using the space.",
      },
    ]
  },
  {
    id: "akshardham",
    title: "Swaminarayan Akshardham",
    subtitle: "Akshardham Temple",
    category: "Spiritual",
    categoryColor: "#3a2b00", // Gold / Earth
    rating: 4.9,
    reviewsCount: 38200,
    distance: "4.8 km",
    city: "New Delhi",
    coords: { lat: 28.6127, lng: 77.2773 },
    image: "https://images.unsplash.com/photo-1608463183577-49405d4b532d?q=80&w=1200&auto=format&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1608463183577-49405d4b532d?q=80&w=1600&auto=format&fit=crop",
    unescoStatus: false,
    builtYear: "2005 AD",
    architect: "BAPS Swaminarayan Sanstha",
    patron: "Pramukh Swami Maharaj",
    architecturalStyle: "Vastu Shastra & Pancharatra Shastra",
    openingHours: "10:00 AM – 6:30 PM (Closed Mondays)",
    bestTimeToVisit: "4:00 PM – 8:00 PM (To catch the Musical Fountain)",
    entryFee: "Free Complex Entry / ₹250 (Exhibitions & Boat Ride)",
    avgTimeSpent: "3 – 4 Hours",
    shortDescription: "A contemporary temple complex celebrating Indian culture, craft and spirituality.",
    tags: ["Spiritual", "Architecture", "Family friendly"],
    visitDuration: 210,
    fee: "Free complex entry; exhibitions extra",
    walkingEffort: "high",
    seniorFriendly: false,
    kidFriendly: true,
    guidePassPrice: 149,
    overview: "Swaminarayan Akshardham is a massive Hindu temple complex displaying millennia of traditional Indian and Hindu culture, spirituality, and architecture. Constructed entirely without steel, it features 234 ornate pillars, 9 domes, and 20,000 statues.",
    storyContent: {
      headline: "The Modern Marvel of Vedic Stone Architecture",
      intro: "Built in just 5 years by 11,000 artisans and volunteers, Akshardham is carved entirely from Pink Sandstone and Italian Carrara Marble.",
      bodyParagraphs: [
        "Inaugurated in November 2005, Akshardham stands on the banks of the Yamuna River. The central monument (Mandir) was constructed without using any structural steel or iron.",
        "The complex includes the Sahaj Anand Water Show, a 15-minute cultural boat ride (Sanskruti Vihar) tracing 10,000 years of Indian heritage, and extensive lush gardens.",
        "The Gajendra Pith base features 148 life-sized carved stone elephants symbolizing peace, devotion, and harmony."
      ],
      architecturalSecrets: [
        {
          title: "Interlocking Stone Joinery",
          desc: "Built using ancient mortise-and-tenon interlocking stone joints that withstand seismic activity for centuries."
        },
        {
          title: "No Ferrous Metals Used",
          desc: "Zero steel, concrete, or iron was used in the main mandir structure to guarantee longevity over 1,000 years."
        }
      ]
    },
    audioChapters: [
      {
        id: "ak1",
        title: "Mayur Dwar & Entrance Gates",
        duration: "03:00",
        audioSrc: "",
        transcript: "Welcome to Akshardham. Walk through the Mayur Dwar, featuring 869 carved peacocks representing joy and grace in Indian tradition."
      },
      {
        id: "ak2",
        title: "The Main Mandir Sanctum",
        duration: "05:00",
        audioSrc: "",
        transcript: "Step onto the marble platform. Notice the 234 intricately carved pillars and 20,000 sculpted divine figures adorning the facade."
      }
    ],
    keyHighlights: [
      "Guinness World Record for Largest Comprehensive Hindu Temple",
      "Carved without structural steel from Pink Rajasthani Sandstone",
      "Sanskruti Vihar 15-minute heritage boat journey",
      "Sahaj Anand Light & Water Fountain Show at dusk"
    ],
    nearbyDining: [
      { name: "Premvati Food Court", cuisine: "Pure Vegetarian Indian", distance: "Inside Complex", rating: 4.8, coords: { lat: 28.6128, lng: 77.2774 }, approx: true }
    ]
  },
  {
    id: "qutub-minar",
    title: "Qutub Minar Complex",
    subtitle: "Qutb Victory Tower",
    category: "Heritage",
    categoryColor: "#974730",
    rating: 4.7,
    reviewsCount: 22100,
    distance: "8.5 km",
    city: "New Delhi",
    coords: { lat: 28.5244, lng: 77.1855 },
    image: "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=1200&auto=format&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=1600&auto=format&fit=crop",
    unescoStatus: true,
    builtYear: "1199 AD",
    architect: "Qutb-ud-din Aibak & Iltutmish",
    patron: "Delhi Sultanate",
    architecturalStyle: "Indo-Islamic Gothic Tower",
    openingHours: "7:00 AM – 5:00 PM (Daily)",
    bestTimeToVisit: "8:00 AM – 11:00 AM",
    entryFee: "₹40 (Indian Nationals) / ₹600 (Foreign Nationals)",
    avgTimeSpent: "1.5 Hours",
    shortDescription: "A towering Delhi Sultanate minaret set within a layered archaeological complex.",
    tags: ["Delhi Sultanate", "UNESCO", "Architecture"],
    visitDuration: 90,
    fee: "₹40 Indian / ₹600 foreign",
    walkingEffort: "high",
    seniorFriendly: false,
    kidFriendly: true,
    guidePassPrice: 99,
    overview: "Qutub Minar is a 72.5-meter tall brick minaret, making it the tallest brick minaret in the world. Built in 1199 AD to celebrate victory, the complex also houses the famous rust-resistant 1,600-year-old Iron Pillar of Chandragupta II.",
    storyContent: {
      headline: "The Soaring Landmark of the Delhi Sultanate",
      intro: "Rising five distinct stories into the sky, Qutub Minar marks the arrival of Islamic rule and architectural synthesis in North India.",
      bodyParagraphs: [
        "Started by Qutb-ud-din Aibak in 1199 and finished by his successor Iltutmish, the minaret features intricate calligraphic bands inscribed with Quranic verses.",
        "The complex contains the Quwwat-ul-Islam Mosque, the Alai Darwaza gateway, and the mysterious Iron Pillar which has resisted corrosion for over 16 centuries."
      ],
      architecturalSecrets: [
        {
          title: "The Rustless Iron Pillar",
          desc: "Formed of 98% wrought iron with high phosphorus content, forming a protective passive protective oxide layer."
        }
      ]
    },
    audioChapters: [
      {
        id: "qm1",
        title: "The Base of the Tower",
        duration: "03:30",
        audioSrc: "",
        transcript: "Stand at the base of the minaret. Notice the alternating fluted angular and rounded red sandstone sections carved with Arabic calligraphy."
      }
    ],
    keyHighlights: [
      "World's tallest brick minaret (72.5 meters)",
      "UNESCO World Heritage site since 1993",
      "Ancient 1,600-year-old rust-free Iron Pillar",
      "Alai Darwaza - First true dome in Indian Islamic architecture"
    ],
    nearbyDining: [
      { name: "Olive Bar & Kitchen", cuisine: "Mediterranean", distance: "400m", rating: 4.7, coords: { lat: 28.5358, lng: 77.1851 }, approx: true }
    ],
    visitorGuidelines: {
      dressCode: "Wear comfortable, weather-appropriate clothing and follow current ASI instructions.",
      footwear: "The complex includes extensive outdoor paths and uneven historic surfaces. Wear comfortable shoes and use marked visitor routes.",
      bagsAndCameras: "Bag screening and photography rules can change. Check posted notices before entry and keep equipment clear of crowded paths.",
      security: "Allow time for entry screening. Do not climb on or touch monuments; follow barriers and staff instructions.",
      ticketCounter: "Entry tickets are separate from a Sarthi Guide Pass. Confirm current rates and access at the official ASI portal or counter.",
      officialTicketsUrl: "https://asi.paygov.org.in/asi-webapp/#/ticketbooking",
      hours: "The app record lists 7:00 AM–5:00 PM daily. Confirm today's closing time and access onsite.",
      photoSpots: [
        { name: "Qutub Minar", tip: "Use the marked public viewing areas to frame the full tower." },
        { name: "Iron Pillar", tip: "Observe the pillar from its visitor boundary; do not touch the surface." },
        { name: "Alai Darwaza", tip: "Capture the carved entrance details from the open visitor path." }
      ],
      notice: "Routes and access can change for conservation or events. Follow current ASI signage and staff directions. Route suggestions need onsite verification."
    },
    walkingRoute: [
      {
        id: "qutub-minar",
        name: "Qutub Minar",
        direction: "From the signed visitor entrance, follow the public path toward the tall Qutub Minar and remain within marked viewing areas.", // VERIFY-ONSITE: confirm today's entry route and barriers.
        chapterId: "qm1",
        storyChapter: "The Victory Tower",
        tip: "Look for the changing fluted bands and inscriptions from the public viewing area.",
      },
      {
        id: "iron-pillar",
        name: "Iron Pillar",
        direction: "Follow current site signs from the minar viewing area toward the Iron Pillar in the Quwwat-ul-Islam courtyard.", // VERIFY-ONSITE: confirm current signed connection and access.
        chapterId: "qm1",
        storyChapter: "The Iron Pillar",
        tip: "Stay outside any protective boundary and leave room for other visitors.",
      },
      {
        id: "quwwat-mosque",
        name: "Quwwat-ul-Islam Mosque",
        direction: "Continue along the public courtyard path to the remains of Quwwat-ul-Islam Mosque; follow posted barriers around conservation areas.", // VERIFY-ONSITE: confirm route and open areas.
        chapterId: "qm1",
        storyChapter: "Quwwat-ul-Islam Mosque",
        tip: "View the carved columns without touching the stonework.",
      },
      {
        id: "alai-darwaza",
        name: "Alai Darwaza",
        direction: "Use the marked visitor path and site signs to reach Alai Darwaza from the mosque courtyard.", // VERIFY-ONSITE: confirm the route is open and signed.
        chapterId: "qm1",
        storyChapter: "Alai Darwaza",
        tip: "Pause outside the threshold if access is restricted and view the stone details from the visitor path.",
      },
    ]
  },
  {
    id: "lotus-temple",
    title: "Lotus Temple",
    subtitle: "Baha'i House of Worship",
    category: "Spiritual",
    categoryColor: "#3a2b00",
    rating: 4.6,
    reviewsCount: 19800,
    distance: "3.4 km",
    city: "New Delhi",
    coords: { lat: 28.5535, lng: 77.2588 },
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=1200&auto=format&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=1600&auto=format&fit=crop",
    unescoStatus: false,
    builtYear: "1986 AD",
    architect: "Fariborz Sahba",
    patron: "Baha'i Faith",
    architecturalStyle: "Expressionist Sacred Architecture",
    openingHours: "8:30 AM – 5:00 PM (Closed Mondays)",
    bestTimeToVisit: "3:30 PM – 5:00 PM",
    entryFee: "Free Entry",
    avgTimeSpent: "1 Hour",
    shortDescription: "A quiet Baha’i House of Worship known for its sculptural marble petals.",
    tags: ["Spiritual", "Quiet space", "Architecture"],
    visitDuration: 60,
    fee: "Free entry",
    walkingEffort: "low",
    seniorFriendly: true,
    kidFriendly: true,
    guidePassPrice: 49,
    overview: "Notable for its flowerlike shape, the Lotus Temple is a Baha'i House of Worship open to all regardless of religious background. Composed of 27 free-standing marble petals clad in Greek Penteli marble.",
    storyContent: {
      headline: "A Universal Sanctuary of Pure Silence",
      intro: "Designed by Iranian-Canadian architect Fariborz Sahba, the Lotus Temple symbolizes unity, purity, and peace across all faiths.",
      bodyParagraphs: [
        "Inaugurated in December 1986, the temple consists of 27 petals arranged in clusters of three to form nine doors opening onto a central hall capable of holding 2,500 people.",
        "The surrounding nine ponds cool the air naturally as it enters the hall, eliminating the need for mechanical air conditioning."
      ],
      architecturalSecrets: [
        {
          title: "Greek Marble Petals",
          desc: "Crafted from white Penteli marble brought from Greece, the same stone used to build the Parthenon in Athens."
        }
      ]
    },
    audioChapters: [
      {
        id: "lt1",
        title: "Approaching the Petals",
        duration: "02:50",
        audioSrc: "",
        transcript: "Walk along the quiet stone path bordered by nine emerald ponds. As you enter, remember that this sanctuary maintains complete silence for prayer."
      }
    ],
    keyHighlights: [
      "Open to people of all religious backgrounds",
      "Award-winning expressionist architectural lotus design",
      "27 free-standing marble petals arranged in 9 doors",
      "Surrounded by 26 acres of manicured gardens and 9 ponds"
    ],
    nearbyDining: [
      { name: "Nehru Place Food Street", cuisine: "Street Food & Multi-Cuisine", distance: "800m", rating: 4.4, coords: { lat: 28.5499, lng: 77.2528 }, approx: true }
    ]
  },
  {
    id: "red-fort",
    title: "Red Fort (Lal Qila)",
    subtitle: "Quila-e-Mubarak",
    category: "Heritage",
    categoryColor: "#974730",
    rating: 4.7,
    reviewsCount: 31000,
    distance: "6.2 km",
    city: "Old Delhi",
    coords: { lat: 28.6562, lng: 77.2410 },
    image: "https://images.unsplash.com/photo-1598977123118-4e30ba3c4f5b?q=80&w=1200&auto=format&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1598977123118-4e30ba3c4f5b?q=80&w=1600&auto=format&fit=crop",
    unescoStatus: true,
    builtYear: "1648 AD",
    architect: "Ustad Ahmad Lahori",
    patron: "Emperor Shah Jahan",
    architecturalStyle: "Shahjahani Mughal Fort",
    openingHours: "9:30 AM – 4:30 PM (Closed Mondays)",
    bestTimeToVisit: "9:30 AM – 12:00 PM",
    entryFee: "₹50 (Indian Nationals) / ₹600 (Foreign Nationals)",
    avgTimeSpent: "2.5 Hours",
    shortDescription: "Shah Jahan’s red sandstone fort and the ceremonial heart of Mughal Delhi.",
    tags: ["Mughal", "UNESCO", "Fort"],
    visitDuration: 150,
    fee: "₹50 Indian / ₹600 foreign",
    walkingEffort: "high",
    seniorFriendly: false,
    kidFriendly: true,
    guidePassPrice: 99,
    overview: "The Red Fort was the main seat of the Mughal Emperors for nearly 200 years. Built by Shah Jahan when he moved his capital from Agra to Shahjahanabad, its massive red sandstone walls enclose royal palaces, the Diwan-i-Aam, and Diwan-i-Khas.",
    storyContent: {
      headline: "The Epic Seat of Mughal Empire & Indian Independence",
      intro: "Designed by the architect of the Taj Mahal, Lal Qila is where India's Prime Minister hoists the national flag every Independence Day.",
      bodyParagraphs: [
        "Construction began in 1638 and completed ten years later. The fort sits along the Yamuna River and includes Chhatta Chowk (the covered bazaar), Diwan-i-Aam (Hall of Public Audience), and Diwan-i-Khas where the Peacock Throne once stood.",
        "On 15 August 1947, Jawaharlal Nehru raised the Indian tricolor flag above Lahori Gate, establishing the symbol of India's freedom."
      ],
      architecturalSecrets: [
        {
          title: "Nahr-i-Bihisht (Stream of Paradise)",
          desc: "A continuous water canal connecting all royal pavilions, fed directly from the Yamuna River."
        }
      ]
    },
    audioChapters: [
      {
        id: "rf1",
        title: "Lahori Gate Entry",
        duration: "03:15",
        audioSrc: "",
        transcript: "Welcome to Lahori Gate, the main entrance of Red Fort facing Old Delhi. Notice the majestic octagonal towers crowned by white marble chhatris."
      }
    ],
    keyHighlights: [
      "UNESCO World Heritage Site",
      "Independence Day National Flag Hoisting site",
      "Chhatta Chowk historic covered imperial market",
      "Diwan-i-Khas with Persian inscription: 'If there is paradise on earth, it is this, it is this, it is this.'"
    ],
    nearbyDining: [
      { name: "Haldiram's Chandni Chowk", cuisine: "North Indian Sweets & Snacks", distance: "300m", rating: 4.6, coords: { lat: 28.6544, lng: 77.2368 }, approx: true }
    ],
    visitorGuidelines: {
      dressCode: "Wear comfortable, weather-appropriate clothing. Follow current instructions from ASI staff.",
      footwear: "Wear comfortable shoes for a large fort complex; use only visitor paths and any marked steps.",
      bagsAndCameras: "Security may inspect bags. Camera rules and fees can change; check current notices before entry.",
      security: "Allow time for security screening. Do not touch or climb on historic structures; follow staff directions.",
      ticketCounter: "Entry tickets are separate from a Sarthi Guide Pass. Check current rates at the ASI counter or official booking portal.",
      officialTicketsUrl: "https://asi.paygov.org.in/asi-webapp/#/ticketbooking",
      hours: "The app record lists 9:30 AM–4:30 PM and Monday closure. Confirm today's access and closing time onsite.",
      photoSpots: [
        { name: "Lahori Gate and entrance approach", tip: "Frame the red sandstone gateway from the public approach; keep access clear." },
        { name: "Chhatta Chowk", tip: "Look for the covered market's repeating arches and details; follow current visitor routing." },
        { name: "Diwan-i-Khas", tip: "Photograph from the visitor boundary and avoid touching the carved surfaces." }
      ],
      notice: "Access to some areas may change. Follow current ASI signage and staff instructions. Directions below are authored suggestions and need onsite verification."
    },
    walkingRoute: [
      {
        id: "lahori-gate",
        name: "Lahori Gate",
        direction: "Begin at the Lahori Gate visitor entrance; follow the signed public route through the gateway toward Chhatta Chowk.", // VERIFY-ONSITE: confirm current entry routing and access.
        chapterId: "rf1",
        storyChapter: "Lahori Gate and the Imperial Entrance",
        tip: "Pause where visitor flow permits and observe the red sandstone gateway from the public path.",
      },
      {
        id: "chhatta-chowk",
        name: "Chhatta Chowk",
        direction: "Continue through the marked visitor passage of Chhatta Chowk toward the open fort grounds; follow onsite signs if the passage is closed.", // VERIFY-ONSITE: confirm passage and route are open.
        chapterId: "rf1",
        storyChapter: "The Covered Bazaar",
        tip: "Notice the repeated roof bays and shop frontage without blocking the walkway.",
      },
      {
        id: "diwan-i-am",
        name: "Diwan-i-Am",
        direction: "From the bazaar exit, follow posted signs toward Diwan-i-Am and remain on the visitor path around the public audience hall.", // VERIFY-ONSITE: confirm the signed connection from the bazaar.
        chapterId: "rf1",
        storyChapter: "The Hall of Public Audience",
        tip: "View the hall from its public boundary; barriers and access can change.",
      },
      {
        id: "diwan-i-khas",
        name: "Diwan-i-Khas",
        direction: "Follow current fort signs from Diwan-i-Am toward the royal residential area and Diwan-i-Khas.", // VERIFY-ONSITE: confirm route access and current signs.
        chapterId: "rf1",
        storyChapter: "The Hall of Private Audience",
        tip: "Read visible inscriptions from the marked visitor area and respect any restricted boundary.",
      },
    ]
  },
  {
    id: "jama-masjid",
    title: "Jama Masjid",
    subtitle: "Masjid-i Jehan-Numa",
    category: "Culture",
    categoryColor: "#162a5a", // Indigo
    rating: 4.6,
    reviewsCount: 16400,
    distance: "6.8 km",
    city: "Old Delhi",
    coords: { lat: 28.6507, lng: 77.2334 },
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=1200&auto=format&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=1600&auto=format&fit=crop",
    unescoStatus: false,
    builtYear: "1656 AD",
    architect: "Ustad Khalil",
    patron: "Emperor Shah Jahan",
    architecturalStyle: "Indo-Islamic Congregational Mosque",
    openingHours: "7:00 AM – 12:00 PM, 1:30 PM – 6:30 PM",
    bestTimeToVisit: "8:00 AM – 10:30 AM",
    entryFee: "Free Entry / ₹300 Camera Fee",
    avgTimeSpent: "1 Hour",
    shortDescription: "A landmark congregational mosque overlooking the lanes of Old Delhi.",
    tags: ["Mughal", "Mosque", "Old Delhi"],
    visitDuration: 60,
    fee: "Free entry; camera fee may apply",
    walkingEffort: "moderate",
    seniorFriendly: false,
    kidFriendly: true,
    guidePassPrice: 49,
    overview: "Jama Masjid is one of the largest mosques in India, constructed by Emperor Shah Jahan using red sandstone and white marble. Its courtyard can accommodate 25,000 worshippers.",
    storyContent: {
      headline: "The Grand Congregational Mosque of Shahjahanabad",
      intro: "Perched atop a hill rock in Old Delhi, Jama Masjid towers over the bustling street markets of Chandni Chowk.",
      bodyParagraphs: [
        "Inaugurated in 1656 by an imam invited from Bukhara (modern Uzbekistan), the mosque features three grand gates, four towers, and two 40-meter minarets striped with red sandstone and white marble."
      ],
      architecturalSecrets: []
    },
    audioChapters: [
      {
        id: "jm1",
        title: "The Eastern Royal Gate",
        duration: "02:40",
        audioSrc: "",
        transcript: "Ascend the 35 red sandstone steps of Gate 1. This eastern portal was reserved exclusively for Emperor Shah Jahan."
      }
    ],
    keyHighlights: [
      "Accommodates 25,000 worshippers in main courtyard",
      "Panoramic views of Old Delhi from Southern Minaret",
      "Houses sacred relics including an ancient Quran written on deer skin"
    ],
    nearbyDining: [
      { name: "Al-Jawahar Restaurant", cuisine: "Mughlai Kebabs & Biryani", distance: "100m", rating: 4.7, coords: { lat: 28.6500, lng: 77.2336 }, approx: true }
    ]
  }
];

export const TRAVELER_TYPES = [
  { id: 'explorer', label: 'The Explorer', icon: 'explore', desc: 'Off the beaten path, hidden gems & authentic walks' },
  { id: 'historian', label: 'The Historian', icon: 'history_edu', desc: 'Deep architectural facts, dynasties & ancient lore' },
  { id: 'foodie', label: 'The Foodie', icon: 'restaurant', desc: 'Street food trails, culinary origins & historic eateries' },
  { id: 'spiritual', label: 'The Spiritual Seeker', icon: 'self_improvement', desc: 'Peaceful sanctuaries, ritual timings & quiet spaces' },
  { id: 'leisure', label: 'Leisure Traveler', icon: 'deck', desc: 'Relaxed pacing, picturesque gardens & cafes' },
  { id: 'photographer', label: 'The Photographer', icon: 'photo_camera', desc: 'Golden hour angles, architectural framing & symmetry' }
];

export const DEFAULT_USER_PROFILE = {
  name: "Aarav Sharma",
  email: "aarav.travels@sarthi.ai",
  travelerType: "historian",
  language: "English",
  monumentsVisited: 14,
  audioHoursListened: 18.5,
  explorationScore: 840,
  level: "Heritage Master",
  savedTripsCount: 5,
  badges: [
    { title: "Mughal Scholar", desc: "Visited 5+ Mughal Dynasty monuments", icon: "castle" },
    { title: "Audio Enthusiast", desc: "Listened to 10+ hours of narration", icon: "headphones" },
    { title: "Delhi Wanderer", desc: "Explored Old & New Delhi heritage hubs", icon: "map" }
  ]
};
