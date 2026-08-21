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
      { name: "Karim's Nizamuddin", cuisine: "Mughlai", distance: "600m", rating: 4.6 },
      { name: "Lodi - The Garden Restaurant", cuisine: "European & Mediterranean", distance: "1.4 km", rating: 4.5 }
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
      { name: "Premvati Food Court", cuisine: "Pure Vegetarian Indian", distance: "Inside Complex", rating: 4.8 }
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
      { name: "Olive Bar & Kitchen", cuisine: "Mediterranean", distance: "400m", rating: 4.7 }
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
      { name: "Nehru Place Food Street", cuisine: "Street Food & Multi-Cuisine", distance: "800m", rating: 4.4 }
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
      { name: "Haldiram's Chandni Chowk", cuisine: "North Indian Sweets & Snacks", distance: "300m", rating: 4.6 }
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
      { name: "Al-Jawahar Restaurant", cuisine: "Mughlai Kebabs & Biryani", distance: "100m", rating: 4.7 }
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
