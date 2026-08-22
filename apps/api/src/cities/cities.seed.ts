import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { City, CityDocument } from "../schemas/city.schema";
import { Activity, ActivityDocument } from "../schemas/activity.schema";

export const initialCities = [
  // =========================================================================
  // 1. INDIAN DESTINATIONS (30 Cities)
  // =========================================================================
  {
    name: "Ahmedabad",
    country: "India",
    costIndex: 1,
    popularityScore: 94,
    imageUrl: "https://images.unsplash.com/photo-1599818818556-947f6323bb6f?q=80&w=1200&auto=format&fit=crop",
    description: "India's first UNESCO World Heritage City in Gujarat, renowned for exquisite subterranean stepwells, Mahatma Gandhi's Sabarmati Ashram, and bustling heritage night markets.",
    activities: [
      { name: "Sabarmati Ashram Gandhi Memorial Tour", category: "Culture", cost: 0, durationMinutes: 120, rating: 4.9, description: "Walk through Hriday Kunj, Gandhi's humble riverside residence and the historic epicenter of the Salt March." },
      { name: "Adalaj Stepwell (Vav) Architectural Exploration", category: "Sightseeing", cost: 5, durationMinutes: 90, rating: 4.8, description: "Admire the 5-storey deep subterranean sandstone stepwell adorned with ornate Solanki stone carvings." },
      { name: "Manek Chowk Heritage Night Food Trail", category: "Culinary", cost: 12, durationMinutes: 150, rating: 4.8, description: "Taste world-famous Gwalior Dosa, Pav Bhaji, Chocolate Sandwiches, and artisanal Kulfi in the historic jeweler's square." },
      { name: "Sidi Saiyyed Mosque 'Tree of Life' Jali Walk", category: "Culture", cost: 0, durationMinutes: 45, rating: 4.7, description: "Marvel at the intricate 16th-century carved marble filigree latticework depicting the intertwined Tree of Life." },
      { name: "Kankaria Lake Promenade & Light Show", category: "Nature", cost: 2, durationMinutes: 120, rating: 4.6, description: "Stroll along the 15th-century circular lake with balloon rides, musical fountains, and garden islands." },
      { name: "Calico Museum of Textiles Guided Tour", category: "Culture", cost: 0, durationMinutes: 150, rating: 4.9, description: "Explore the world's premier collection of antique Indian court textiles, brocades, and pichwais." },
    ],
  },
  {
    name: "Mumbai",
    country: "India",
    costIndex: 2,
    popularityScore: 98,
    imageUrl: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=1200&auto=format&fit=crop",
    description: "The City of Dreams on the Arabian Sea in Maharashtra, blending grand Victorian Gothic architecture, vibrant Bollywood energy, and iconic coastal promenades.",
    activities: [
      { name: "Gateway of India & Taj Mahal Palace Dawn Walk", category: "Sightseeing", cost: 0, durationMinutes: 90, rating: 4.9, description: "Witness sunrise over the Arabian Sea at the iconic basalt triumphal arch opposite the grand heritage palace hotel." },
      { name: "Marine Drive Queen's Necklace Sunset Stroll", category: "Sightseeing", cost: 0, durationMinutes: 120, rating: 4.8, description: "Stroll the 3.6-kilometer seaside promenade as the curved arc of streetlights illuminates like a string of pearls." },
      { name: "Elephanta Caves Island Excursion", category: "Culture", cost: 15, durationMinutes: 240, rating: 4.8, description: "Take a harbour ferry to UNESCO-listed 5th-century rock-cut cave temples featuring the colossal Trimurti Shiva sculpture." },
      { name: "Bandra Heritage Village & Street Art Trail", category: "Culture", cost: 0, durationMinutes: 120, rating: 4.7, description: "Explore quaint Portuguese-style bungalows in Ranwar Village, indie cafes, and vibrant mural alleys on Chapel Road." },
      { name: "Chowpatty Beach Street Food & Kulfi Tasting", category: "Culinary", cost: 8, durationMinutes: 90, rating: 4.7, description: "Relish crunchy spicy Bhelpuri, Sevpuri, butter-drenched Pav Bhaji, and roasted Corn on the cob by the sea." },
      { name: "Chhatrapati Shivaji Maharaj Terminus (CST) Heritage Tour", category: "Culture", cost: 5, durationMinutes: 60, rating: 4.8, description: "Tour the breathtaking UNESCO Victorian Gothic railway palace featuring gargoyles, domes, and stained glass." },
    ],
  },
  {
    name: "Delhi",
    country: "India",
    costIndex: 2,
    popularityScore: 97,
    imageUrl: "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1200&auto=format&fit=crop",
    description: "India's historic capital spanning eight ancient cities, world-renowned Mughal fortresses, leafy imperial avenues, and legendary culinary quarters.",
    activities: [
      { name: "Red Fort (Lal Qila) Mughal Citadel Tour", category: "Culture", cost: 10, durationMinutes: 150, rating: 4.8, description: "Explore the massive red sandstone palace fortress that served as the primary residence of the Mughal Emperors." },
      { name: "Qutub Minar & Mehrauli Archaeological Walk", category: "Sightseeing", cost: 10, durationMinutes: 120, rating: 4.9, description: "Stand beneath the world's tallest brick minaret and examine the rust-resistant 4th-century Iron Pillar of Delhi." },
      { name: "Humayun's Tomb Persian Garden Experience", category: "Culture", cost: 10, durationMinutes: 100, rating: 4.9, description: "Walk through the serene charbagh water gardens surrounding the UNESCO red-sandstone mausoleum that inspired the Taj Mahal." },
      { name: "Old Delhi Rickshaw Safari & Paranthe Wali Gali", category: "Culinary", cost: 15, durationMinutes: 150, rating: 4.8, description: "Weave through the bustling alleys of Chandni Chowk, sampling stuffed pan-fried breads and fragrant jalebis." },
      { name: "India Gate & Kartavya Path Evening Promenade", category: "Sightseeing", cost: 0, durationMinutes: 90, rating: 4.7, description: "Pay respects at the National War Memorial and enjoy street treats on the ceremonial boulevard." },
      { name: "Swaminarayan Akshardham Cultural Boat Ride", category: "Culture", cost: 8, durationMinutes: 240, rating: 4.9, description: "Marvel at thousands of intricately hand-carved stone deities, musical water fountain shows, and cultural exhibitions." },
    ],
  },
  {
    name: "Jaipur",
    country: "India",
    costIndex: 2,
    popularityScore: 98,
    imageUrl: "https://images.unsplash.com/photo-1603288940300-349f28d7a16b?q=80&w=1200&auto=format&fit=crop",
    description: "The vibrant Pink City of Rajasthan, famous for hilltop forts, honeycomb palaces, royal astronomical instruments, and world-class artisanal gemstone markets.",
    activities: [
      { name: "Amber Fort & Sheesh Mahal Royal Palace Tour", category: "Sightseeing", cost: 12, durationMinutes: 210, rating: 4.9, description: "Explore the hilltop Rajput fortress and its famed Hall of Mirrors illuminated by candle reflections." },
      { name: "Hawa Mahal (Palace of Winds) Photo Walk", category: "Sightseeing", cost: 5, durationMinutes: 60, rating: 4.8, description: "Photograph the iconic 5-storey honeycomb facade featuring 953 intricately carved pink sandstone jharokha windows." },
      { name: "City Palace & Royal Chandra Mahal Quarters", category: "Culture", cost: 18, durationMinutes: 150, rating: 4.8, description: "Walk through courtyards painted with peacock motifs and view royal Rajput weaponry and costumes." },
      { name: "Jantar Mantar Astronomical UNESCO Site", category: "Culture", cost: 6, durationMinutes: 90, rating: 4.7, description: "Learn how the world's largest stone sundial measures local time with astonishing 2-second accuracy." },
      { name: "Nahargarh Fort Sunset Skyline Vista", category: "Adventure", cost: 8, durationMinutes: 120, rating: 4.8, description: "Enjoy panoramic rooftop sunset views of the entire Jaipur walled city spread below the Aravalli hills." },
      { name: "Johari Bazaar Block Print & Gemstone Shopping", category: "Shopping", cost: 20, durationMinutes: 120, rating: 4.7, description: "Browse traditional Sanganeri block-printed textiles, blue pottery, and handcrafted Kundan jewelry." },
    ],
  },
  {
    name: "Udaipur",
    country: "India",
    costIndex: 2,
    popularityScore: 96,
    imageUrl: "https://images.unsplash.com/photo-1595658658481-d53d3f999875?q=80&w=1200&auto=format&fit=crop",
    description: "The Venice of the East in southern Rajasthan, framed by the Aravalli hills, glittering lakes, white marble island palaces, and Rajput romance.",
    activities: [
      { name: "Lake Pichola Sunset Boat Cruise to Jagmandir", category: "Sightseeing", cost: 14, durationMinutes: 90, rating: 4.9, description: "Cruise peaceful shimmering waters admiring the illuminated City Palace and Lake Palace reflecting at twilight." },
      { name: "Udaipur City Palace Complex & Crystal Gallery", category: "Culture", cost: 12, durationMinutes: 180, rating: 4.9, description: "Rajasthan's largest royal palace complex with mosaic peacock courtyards, mirror balconies, and scenic lake views." },
      { name: "Bagore Ki Haveli Rajasthani Folk Dance & Puppets", category: "Culture", cost: 6, durationMinutes: 75, rating: 4.8, description: "Watch energetic Chari fire dances and Kalbelia snake dances on the historic waterfront courtyard." },
      { name: "Saheliyon Ki Bari Royal Garden of Maidens", category: "Nature", cost: 4, durationMinutes: 60, rating: 4.6, description: "Stroll through marble elephants, rain fountains, lotus pools, and lush green royal lawns." },
      { name: "Sajjangarh (Monsoon Palace) Hilltop Sunset", category: "Nature", cost: 8, durationMinutes: 120, rating: 4.7, description: "Ascend the high mountain ridge overlooking Udaipur lakes and countryside as daylight turns to amber." },
      { name: "Jagdish Temple Morning Aarti & Stone Carvings", category: "Spiritual", cost: 0, durationMinutes: 60, rating: 4.8, description: "Experience morning devotional chanting at the 1651 Indo-Aryan temple adorned with three tiers of stone sculptures." },
    ],
  },
  {
    name: "Jodhpur",
    country: "India",
    costIndex: 2,
    popularityScore: 93,
    imageUrl: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=1200&auto=format&fit=crop",
    description: "The Blue City of Rajasthan on the edge of the Thar Desert, guarded by the invincible cliff-top Mehrangarh Fort and indigo-painted old quarters.",
    activities: [
      { name: "Mehrangarh Fort Flying Fox Zip-lining Experience", category: "Adventure", cost: 35, durationMinutes: 120, rating: 4.9, description: "Glide on 6 aerial zip lines across fort battlements, desert lakes, and dramatic rock formations." },
      { name: "Blue City Brahmin Quarter Guided Photo Walk", category: "Culture", cost: 10, durationMinutes: 120, rating: 4.8, description: "Navigate narrow blue-washed maze alleys, meeting local residents and exploring hidden courtyard shrines." },
      { name: "Jaswant Thada White Marble Memorial Garden", category: "Sightseeing", cost: 3, durationMinutes: 60, rating: 4.7, description: "Admire intricately carved translucent marble sheets that glow warm gold in the desert sunlight." },
      { name: "Umaid Bhawan Palace Art Deco Museum Tour", category: "Culture", cost: 8, durationMinutes: 90, rating: 4.7, description: "Tour one of the world's largest private royal residences and view vintage cars and Art Deco furnishings." },
      { name: "Clock Tower & Sardar Market Spices Trail", category: "Culinary", cost: 5, durationMinutes: 90, rating: 4.8, description: "Sample famous spicy Pyaaz Ki Kachori, creamy Makhaniya Lassi, and buy Mathania red chilies and teas." },
      { name: "Mandore Gardens Cenotaph Exploration", category: "Nature", cost: 2, durationMinutes: 100, rating: 4.6, description: "Discover ancient rock-cut royal cenotaphs, lush terrace gardens, and playful langurs." },
    ],
  },
  {
    name: "Agra",
    country: "India",
    costIndex: 2,
    popularityScore: 99,
    imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1200&auto=format&fit=crop",
    description: "The historic Mughal capital on the Yamuna River in Uttar Pradesh, home to the peerless Taj Mahal and grand imperial monuments.",
    activities: [
      { name: "Taj Mahal Sunrise Wonder of the World Tour", category: "Sightseeing", cost: 15, durationMinutes: 180, rating: 5.0, description: "Witness changing hues of dawn illuminating the pure white Makrana marble monument to eternal love." },
      { name: "Agra Fort Mughal Imperial Citadel Walk", category: "Culture", cost: 10, durationMinutes: 120, rating: 4.9, description: "Tour the colossal red sandstone palace where Emperor Shah Jahan spent his final years gazing at the Taj Mahal." },
      { name: "Mehtab Bagh Sunset Reflection Viewpoint", category: "Sightseeing", cost: 5, durationMinutes: 90, rating: 4.8, description: "View the romantic reflection of the Taj Mahal across the Yamuna River at tranquil sunset without the crowds." },
      { name: "Fatehpur Sikri Abandoned Imperial City", category: "Culture", cost: 10, durationMinutes: 240, rating: 4.8, description: "Explore Emperor Akbar's 16th-century ghost capital and pass through the towering Buland Darwaza gate." },
      { name: "Kinari Bazaar Petha Tasting & Leather Crafts", category: "Culinary", cost: 6, durationMinutes: 90, rating: 4.6, description: "Taste authentic candied ash-gourd Petha in flavors ranging from saffron to paan in the bustling bazaar." },
      { name: "Tomb of I'timad-ud-Daulah (Baby Taj)", category: "Culture", cost: 6, durationMinutes: 60, rating: 4.7, description: "Examine the delicate pietra dura gemstone inlay work that served as the architectural draft for the Taj Mahal." },
    ],
  },
  {
    name: "Varanasi",
    country: "India",
    costIndex: 1,
    popularityScore: 97,
    imageUrl: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=1200&auto=format&fit=crop",
    description: "One of the world's oldest continuously inhabited sacred cities in Uttar Pradesh, pulsing with spiritual rituals, ancient ghats, and silk weaving along the Holy Ganges.",
    activities: [
      { name: "Dashashwamedh Ghat Grand Evening Ganga Aarti", category: "Spiritual", cost: 0, durationMinutes: 90, rating: 5.0, description: "Witness the spellbinding choreography of brass oil lamps, conch shells, incense, and Vedic hymns at the holy riverbank." },
      { name: "Sunrise Rowboat Cruise along Sacred Ghats", category: "Sightseeing", cost: 10, durationMinutes: 120, rating: 4.9, description: "Float past 88 historic stone ghats observing morning ablutions, yogis, and centuries-old riverside palaces." },
      { name: "Sarnath Deer Park & Dhamek Stupa Pilgrimage", category: "Spiritual", cost: 6, durationMinutes: 180, rating: 4.8, description: "Visit the sacred deer park where Gautama Buddha taught his first sermon after attaining enlightenment." },
      { name: "Old City Alleyways & Banarasi Chaat Crawl", category: "Culinary", cost: 8, durationMinutes: 120, rating: 4.8, description: "Taste Tamatar Chaat, Malaiyyo foam sweet, Blue Lassi, and genuine Banarasi Paan in narrow labyrinthine lanes." },
      { name: "Banarasi Silk Weaving Masterclass & Loom Visit", category: "Culture", cost: 15, durationMinutes: 90, rating: 4.7, description: "Meet master Muslim weavers hand-crafting pure silk sarees with gold and silver zari threads on handlooms." },
      { name: "Kashi Vishwanath Golden Temple Darshan", category: "Spiritual", cost: 0, durationMinutes: 90, rating: 4.9, description: "Pay homage at the revered Jyotirlinga shrine featuring a 15.5-meter tall gold-plated spire." },
    ],
  },
  {
    name: "Amritsar",
    country: "India",
    costIndex: 1,
    popularityScore: 95,
    imageUrl: "https://images.unsplash.com/photo-1588096344356-9b497b7b3a4f?q=80&w=1200&auto=format&fit=crop",
    description: "The spiritual heart of Sikhism in Punjab, famous for the gilded Golden Temple, extraordinary community kitchen (Langar), and patriotic border ceremonies.",
    activities: [
      { name: "Golden Temple (Harmandir Sahib) & Langar Service", category: "Spiritual", cost: 0, durationMinutes: 240, rating: 5.0, description: "Experience serene night reflections on the Amrit Sarovar pool and volunteer in the kitchen feeding 100,000 daily for free." },
      { name: "Wagah Border Beating Retreat Ceremony", category: "Culture", cost: 0, durationMinutes: 180, rating: 4.9, description: "Feel electrifying national pride as Indian and Pakistani border guards perform synchronized military drills at sunset." },
      { name: "Jallianwala Bagh Historic Memorial Walk", category: "Culture", cost: 0, durationMinutes: 60, rating: 4.7, description: "Pay solemn respects at the bullet-scarred historic walls and martyrs' well of the 1919 independence struggle." },
      { name: "Old City Amritsari Kulcha & Lassi Trail", category: "Culinary", cost: 6, durationMinutes: 90, rating: 4.9, description: "Taste crisp tandoor-baked potato kulchas served with spicy chole, dollops of white butter, and thick sweet lassi." },
      { name: "Partition Museum at Town Hall", category: "Culture", cost: 3, durationMinutes: 120, rating: 4.8, description: "Engage with poignant oral histories, photographs, and artifacts from the 1947 partition of the subcontinent." },
      { name: "Gobindgarh Fort Light & Laser Show", category: "Sightseeing", cost: 6, durationMinutes: 90, rating: 4.7, description: "Watch a high-tech 7D simulation and laser presentation chronicling Maharaja Ranjit Singh and Punjab history." },
    ],
  },
  {
    name: "Chandigarh",
    country: "India",
    costIndex: 1,
    popularityScore: 89,
    imageUrl: "https://images.unsplash.com/photo-1622396481304-4b53e8a2d5c7?q=80&w=1200&auto=format&fit=crop",
    description: "India's premier planned modernist metropolis masterminded by Swiss-French architect Le Corbusier, featuring sculpture parks and mountain vistas.",
    activities: [
      { name: "Nek Chand's Rock Garden Recycled Sculptures", category: "Culture", cost: 3, durationMinutes: 120, rating: 4.8, description: "Wander through a whimsical 40-acre wonderland built entirely from discarded ceramic tiles, bangles, and industrial waste." },
      { name: "Sukhna Lake Boating & Promenade Walk", category: "Nature", cost: 4, durationMinutes: 90, rating: 4.7, description: "Enjoy paddle boating against the backdrop of the Shivalik foothills and stroll the manicured 3-km walking trail." },
      { name: "Le Corbusier Capitol Complex UNESCO Tour", category: "Sightseeing", cost: 0, durationMinutes: 120, rating: 4.8, description: "Tour the monumental brutalist Secretariat, High Court, Legislative Assembly, and Open Hand Monument." },
      { name: "Zakir Hussain Rose Garden Stroll", category: "Nature", cost: 1, durationMinutes: 75, rating: 4.6, description: "Admire Asia's largest rose garden showcasing over 50,000 rose bushes across 1,600 varieties and medicinal groves." },
      { name: "Sector 17 Plaza Open-Air Shopping & Dining", category: "Shopping", cost: 15, durationMinutes: 120, rating: 4.5, description: "Walk the pedestrian-only city center with central fountains, North Indian eateries, and handicraft emporiums." },
      { name: "Government Museum & Art Gallery", category: "Culture", cost: 2, durationMinutes: 90, rating: 4.7, description: "Explore fine Gandharan Buddhist stone sculptures, Pahari miniature paintings, and modern Indian art." },
    ],
  },
  {
    name: "Goa",
    country: "India",
    costIndex: 2,
    popularityScore: 99,
    imageUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop",
    description: "The tropical beach paradise of India along the Konkan coast, celebrating Portuguese colonial heritage, golden sand beaches, spice plantations, and vibrant nightlife.",
    activities: [
      { name: "Old Goa Basilica of Bom Jesus UNESCO Heritage", category: "Culture", cost: 0, durationMinutes: 90, rating: 4.9, description: "Explore the 1605 baroque basilica holding the sacred relics of St. Francis Xavier and Sé Cathedral's Golden Bell." },
      { name: "Palolem Beach Kayaking & Dolphin Spotting", category: "Adventure", cost: 18, durationMinutes: 150, rating: 4.8, description: "Paddle along the crescent beach to Butterfly Beach and spot playful Arabian Sea dolphins in calm waters." },
      { name: "Fontainhas Latin Quarter Heritage Walk in Panaji", category: "Culture", cost: 0, durationMinutes: 90, rating: 4.8, description: "Photograph vibrant pastel yellow and terracotta tiled Portuguese houses with projecting balconies." },
      { name: "Dudhsagar Waterfalls Trek & Jeep Safari", category: "Adventure", cost: 25, durationMinutes: 300, rating: 4.9, description: "Ride 4x4 open jeeps through Bhagwan Mahavir Wildlife Sanctuary to the dramatic 310-meter four-tiered milky cascade." },
      { name: "Sahakari Spice Plantation Organic Tour & Lunch", category: "Culinary", cost: 12, durationMinutes: 150, rating: 4.7, description: "Learn how cardamom, peri-peri, and vanilla grow, followed by a traditional Goan fish curry buffet on banana leaves." },
      { name: "Anjuna Beach Sunset & Night Bazaar", category: "Nightlife", cost: 10, durationMinutes: 180, rating: 4.7, description: "Listen to live acoustic music, shop bohemian crafts, and enjoy beach shack cocktails under the stars." },
    ],
  },
  {
    name: "Bengaluru",
    country: "India",
    costIndex: 2,
    popularityScore: 95,
    imageUrl: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=1200&auto=format&fit=crop",
    description: "The Garden City and Silicon Valley of India in Karnataka, combining expansive royal botanical parks, Tudor castles, and an electric craft brewing scene.",
    activities: [
      { name: "Lalbagh Botanical Garden Glass House Morning Walk", category: "Nature", cost: 2, durationMinutes: 120, rating: 4.8, description: "Stroll amidst century-old trees and visit the iconic 1889 London Crystal Palace-inspired glass conservatory." },
      { name: "Bangalore Palace Tudor Castle Tour", category: "Sightseeing", cost: 8, durationMinutes: 90, rating: 4.7, description: "Explore the wooden carved palace reminiscent of Windsor Castle, adorned with Victorian paintings and turrets." },
      { name: "Indiranagar & Koramangala Craft Microbrewery Trail", category: "Nightlife", cost: 25, durationMinutes: 180, rating: 4.9, description: "Sample artisanal mango IPAs, Belgian Wits, and wood-fired sourdough pizzas in rooftop garden breweries." },
      { name: "Cubbon Park & Vidhana Soudha Architecture Walk", category: "Sightseeing", cost: 0, durationMinutes: 100, rating: 4.7, description: "Walk under bamboo clusters to view the monumental Neo-Dravidian granite legislative assembly palace." },
      { name: "CTR Shri Sagar Crispy Benne Dosa & Filter Coffee", category: "Culinary", cost: 4, durationMinutes: 60, rating: 4.9, description: "Savor golden crispy butter masala dosas paired with piping hot frothy South Indian chicory filter coffee." },
      { name: "Bannerghatta National Park Safari & Butterfly Dome", category: "Wildlife", cost: 15, durationMinutes: 240, rating: 4.6, description: "Board an enclosed safari to spot Bengal tigers, lions, and Asian elephants, then walk inside the circular butterfly house." },
    ],
  },
  {
    name: "Hyderabad",
    country: "India",
    costIndex: 2,
    popularityScore: 94,
    imageUrl: "https://images.unsplash.com/photo-1605007493699-ce65834f8a00?q=80&w=1200&auto=format&fit=crop",
    description: "The City of Pearls and Nizams in Telangana, famed for 400-year-old minarets, diamond fortresses, and authentic world-famous aromatic biryani.",
    activities: [
      { name: "Charminar & Laad Bazaar Pearl Shopping", category: "Sightseeing", cost: 3, durationMinutes: 120, rating: 4.8, description: "Climb the 1591 monument with four grand minarets and shop for lacquer bangles and Basra pearls." },
      { name: "Golconda Fort Acoustic Marvel & Sound-Light Show", category: "Culture", cost: 6, durationMinutes: 180, rating: 4.9, description: "Test the incredible acoustic clap heard 1 km away at the summit and explore the vault where the Koh-i-Noor diamond was kept." },
      { name: "Authentic Hyderabadi Dum Biryani Feast at Paradise", category: "Culinary", cost: 10, durationMinutes: 90, rating: 4.9, description: "Savor fragrant slow-cooked saffron basmati rice with tender spiced mutton, mirchi ka salan, and raita." },
      { name: "Chowmahalla Palace Nizam Royal Courtyards", category: "Culture", cost: 5, durationMinutes: 120, rating: 4.8, description: "Admire opulent Belgian crystal chandeliers, royal coronation thrones, and the Nizam's vintage 1912 Rolls Royce." },
      { name: "Hussain Sagar Lake Buddha Statue Boat Cruise", category: "Sightseeing", cost: 4, durationMinutes: 75, rating: 4.6, description: "Take a speedboat to the world's tallest monolithic granite statue of Gautama Buddha in the center of the lake." },
      { name: "Qutb Shahi Tombs Heritage Restoration Park", category: "Culture", cost: 3, durationMinutes: 90, rating: 4.7, description: "Marvel at dome mausoleums blending Persian, Hindu, and Pathan architectural elements in landscaped gardens." },
    ],
  },
  {
    name: "Chennai",
    country: "India",
    costIndex: 1,
    popularityScore: 92,
    imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1200&auto=format&fit=crop",
    description: "The cultural gateway to South India along the Coromandel Coast in Tamil Nadu, rich in classical Carnatic music, Dravidian temples, and sandy coastlines.",
    activities: [
      { name: "Kapaleeshwarar Temple Dravidian Gopuram Walk", category: "Culture", cost: 0, durationMinutes: 90, rating: 4.9, description: "Admire the towering 37-meter rainbow gopuram depicting hundreds of intricate Hindu mythological sculptures in Mylapore." },
      { name: "Marina Beach World's Second Longest Natural Beach", category: "Sightseeing", cost: 0, durationMinutes: 120, rating: 4.7, description: "Walk the 13-kilometer shoreline, taste fresh fried fish, and ride the old lighthouse elevator for coastal views." },
      { name: "San Thome Basilica & Apostle St. Thomas Tomb", category: "Culture", cost: 0, durationMinutes: 60, rating: 4.7, description: "Visit the pristine white neo-gothic cathedral built over the tomb of Saint Thomas the Apostle." },
      { name: "Mylapore Heritage Walk & Tiffin Breakfast Trail", category: "Culinary", cost: 6, durationMinutes: 120, rating: 4.8, description: "Sample fluffy Idlis, Podi Ghee Roast Dosa, Medu Vada, and hot filter coffee at legendary Rayar's Mess." },
      { name: "DakshinaChitra Living History Heritage Museum", category: "Culture", cost: 8, durationMinutes: 180, rating: 4.8, description: "Walk through authentic reconstructed heritage homes from Tamil Nadu, Kerala, Karnataka, and Andhra Pradesh." },
      { name: "Fort St. George & Colonial Museum", category: "Culture", cost: 4, durationMinutes: 90, rating: 4.6, description: "Explore the first British fortress built in India in 1644 and see historic colonial maps, coins, and uniforms." },
    ],
  },
  {
    name: "Kochi",
    country: "India",
    costIndex: 2,
    popularityScore: 96,
    imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop",
    description: "The Queen of the Arabian Sea in Kerala, celebrating Chinese fishing nets, spice trading alleys in Jew Town, and tranquil palm-fringed backwaters.",
    activities: [
      { name: "Fort Kochi Chinese Fishing Nets Sunset", category: "Sightseeing", cost: 2, durationMinutes: 75, rating: 4.9, description: "Watch fishermen operate the massive 14th-century cantilevered fishing nets as the sun dips below the Arabian Sea." },
      { name: "Mattancherry Palace (Dutch Palace) & Jew Town", category: "Culture", cost: 3, durationMinutes: 120, rating: 4.8, description: "Admire Ramayana murals, explore the 1568 Paradesi Synagogue, and shop for vintage clocks, brass lamps, and spices." },
      { name: "Kerala Kathakali Dance Drama & Makeup Demonstration", category: "Culture", cost: 10, durationMinutes: 120, rating: 4.9, description: "Watch artists apply natural herbal makeup and perform dramatic stories with expressive eye and mudra gestures." },
      { name: "Alleppey Backwaters Private Houseboat Day Cruise", category: "Nature", cost: 60, durationMinutes: 300, rating: 5.0, description: "Glide through emerald backwater canals on a traditional thatched Kettuvallam with fresh coconut and Karimeen fish." },
      { name: "St. Francis Church (Vasco da Gama's Original Tomb)", category: "Culture", cost: 0, durationMinutes: 45, rating: 4.6, description: "Step inside India's oldest European church where Portuguese explorer Vasco da Gama was first buried in 1524." },
      { name: "Kerala Ayurveda Herbal Rejuvenation Massage", category: "Spiritual", cost: 35, durationMinutes: 90, rating: 4.8, description: "Experience authentic Abhyanga oil massage and Shirodhara warm herbal therapy from certified practitioners." },
    ],
  },
  {
    name: "Mysuru",
    country: "India",
    costIndex: 1,
    popularityScore: 93,
    imageUrl: "https://images.unsplash.com/photo-1600100397608-f010f443b74a?q=80&w=1200&auto=format&fit=crop",
    description: "The royal cultural capital of Karnataka, celebrated for its glittering Maharaja's Palace, Ashtanga yoga tradition, sandalwood incense, and Mysore Pak sweets.",
    activities: [
      { name: "Mysore Palace Grand Interior & Illumination", category: "Sightseeing", cost: 6, durationMinutes: 150, rating: 5.0, description: "Tour the Durbar hall, stained-glass ceilings, and behold 100,000 golden incandescent bulbs illuminating on Sunday evenings." },
      { name: "Chamundi Hill & Nandi Monolithic Bull Walk", category: "Spiritual", cost: 0, durationMinutes: 120, rating: 4.8, description: "Climb the 1,000 stone steps to Chamundeshwari Temple and view the 4.8-meter black granite Nandi bull sculpture." },
      { name: "Devaraja Market Scent & Flower Trail", category: "Shopping", cost: 4, durationMinutes: 90, rating: 4.8, description: "Immerse yourself in fragrant jasmine garlands, mounds of vibrant vermilion kumkum, and pure essential oils." },
      { name: "Brindavan Gardens Musical Dancing Fountain Show", category: "Sightseeing", cost: 3, durationMinutes: 120, rating: 4.6, description: "Enjoy terraced Mughal-style botanical gardens with synchronized color fountain water jets below the KRS Dam." },
      { name: "St. Philomena's Neo-Gothic Twin Spire Cathedral", category: "Culture", cost: 0, durationMinutes: 60, rating: 4.7, description: "Admire one of India's tallest churches, designed after the Cologne Cathedral with stained-glass biblical windows." },
      { name: "Original Guru Sweet Mart Mysore Pak Tasting", category: "Culinary", cost: 4, durationMinutes: 45, rating: 4.9, description: "Taste authentic melt-in-mouth royal Mysore Pak made with pure desi ghee and gram flour from the inventor's lineage." },
    ],
  },
  {
    name: "Kolkata",
    country: "India",
    costIndex: 1,
    popularityScore: 94,
    imageUrl: "https://images.unsplash.com/photo-1558431382-27e303142255?q=80&w=1200&auto=format&fit=crop",
    description: "The Cultural Capital of India on the Hooghly River in West Bengal, celebrated for grand colonial monuments, literary addas, yellow taxis, and artisanal sweetshops.",
    activities: [
      { name: "Victoria Memorial White Marble Palace & Gardens", category: "Sightseeing", cost: 5, durationMinutes: 150, rating: 4.9, description: "Tour the majestic British-era marble palace housing historic royal paintings, manuscripts, and landscaped lawns." },
      { name: "Howrah Bridge & Mallick Ghat Flower Market Dawn Walk", category: "Culture", cost: 0, durationMinutes: 90, rating: 4.9, description: "Witness Asia's largest flower market bursting with orange marigold garlands beside the iconic cantilever steel bridge." },
      { name: "Kumartuli Artisan Quarter Clay Idol Making", category: "Culture", cost: 0, durationMinutes: 100, rating: 4.8, description: "Watch master sculptors shape straw, bamboo, and Hooghly clay into majestic Durga Puja deities." },
      { name: "College Street Boi Para & Indian Coffee House Adda", category: "Culture", cost: 4, durationMinutes: 120, rating: 4.8, description: "Browse the world's largest second-hand book market and sip coffee where Nobel laureates and filmmakers gathered." },
      { name: "Park Street Heritage Food Crawl & Kathi Rolls", category: "Culinary", cost: 10, durationMinutes: 120, rating: 4.9, description: "Savor the original Nizam's mutton kathi roll, chelo kebabs at Peter Cat, and soft spongy Rossogollas at KC Das." },
      { name: "Dakshineswar Kali Temple & Belur Math Ferry Ride", category: "Spiritual", cost: 4, durationMinutes: 180, rating: 4.8, description: "Visit the 1855 riverside Kali temple and take a ferry across to Swami Vivekananda's Ramakrishna Mission headquarters." },
    ],
  },
  {
    name: "Pune",
    country: "India",
    costIndex: 1,
    popularityScore: 90,
    imageUrl: "https://images.unsplash.com/photo-1627894006066-b4526df61582?q=80&w=1200&auto=format&fit=crop",
    description: "The Oxford of the East and cultural hub of Maharashtra, featuring Maratha hill forts, Osho meditation gardens, and lively student culture.",
    activities: [
      { name: "Shaniwar Wada Peshwa Fort Historical Walk", category: "Culture", cost: 3, durationMinutes: 90, rating: 4.7, description: "Explore the 1732 palace fortress of the Maratha Peshwa rulers featuring the massive spiked Dilli Darwaza gate." },
      { name: "Aga Khan Palace Mahatma Gandhi Memorial", category: "Culture", cost: 3, durationMinutes: 100, rating: 4.8, description: "Tour the Italian-arched palace where Gandhi and Kasturba were interned during the Quit India movement." },
      { name: "Sinhagad Fort Trek & Traditional Pithla Bhakri", category: "Adventure", cost: 6, durationMinutes: 240, rating: 4.9, description: "Hike the historic clifftop fortress captured by Tanaji Malusare and relish hot rustic gram flour curry with millet flatbread." },
      { name: "FC Road & Goodluck Cafe Irani Bun Maska & Chai", category: "Culinary", cost: 3, durationMinutes: 60, rating: 4.8, description: "Experience morning Iranian cafe heritage with crusty buttered buns dipped in rich sweet chai." },
      { name: "Osho Teerth Zen Garden & Bamboo Meditation Walk", category: "Spiritual", cost: 4, durationMinutes: 90, rating: 4.6, description: "Stroll along babbling brooks, wooden footbridges, and bamboo groves in a revitalized urban eco-park." },
      { name: "Raja Dinkar Kelkar Museum Artifacts Tour", category: "Culture", cost: 3, durationMinutes: 120, rating: 4.7, description: "View a stunning 20,000-piece collection of antique Indian musical instruments, carved doors, and royal chessboards." },
    ],
  },
  {
    name: "Manali",
    country: "India",
    costIndex: 2,
    popularityScore: 97,
    imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200&auto=format&fit=crop",
    description: "The Himalayan resort town in Himachal Pradesh, surrounded by snow-dusted peaks, pine forests, hot sulphur springs, and high-altitude mountain passes.",
    activities: [
      { name: "Solang Valley Paragliding & Adventure Sports", category: "Adventure", cost: 40, durationMinutes: 180, rating: 4.9, description: "Tandem paraglide soaring above snowy alpine meadows and take the high-speed ropeway for mountain panoramas." },
      { name: "Rohtang Pass & Atal Tunnel Snow Expedition", category: "Adventure", cost: 30, durationMinutes: 360, rating: 4.9, description: "Ascend to 3,978 meters above sea level to experience natural snowfields and panoramic Pir Panjal peaks." },
      { name: "Hadimba Devi Temple Ancient Cedar Forest Walk", category: "Spiritual", cost: 0, durationMinutes: 75, rating: 4.8, description: "Visit the 1553 four-tiered wooden pagoda temple set amidst towering giant Himalayan deodar trees." },
      { name: "Jogini Waterfalls Pine Forest Trek", category: "Nature", cost: 0, durationMinutes: 150, rating: 4.8, description: "Hike through apple orchards, small mountain hamlets, and pine woods to a cascading glacial waterfall." },
      { name: "Old Manali Bohemian Cafes & River Trout Lunch", category: "Culinary", cost: 15, durationMinutes: 120, rating: 4.7, description: "Relax by the rushing Manalsu River with wood-fired pizzas, herbal teas, and freshly caught Himalayan trout." },
      { name: "Vashisht Natural Sulphur Hot Springs & Bath", category: "Spiritual", cost: 0, durationMinutes: 60, rating: 4.6, description: "Bathe in natural therapeutic mineral thermal water springs flowing beside a 4,000-year-old stone temple." },
    ],
  },
  {
    name: "Shimla",
    country: "India",
    costIndex: 2,
    popularityScore: 94,
    imageUrl: "https://images.unsplash.com/photo-1597074866923-dc0589150358?q=80&w=1200&auto=format&fit=crop",
    description: "The Queen of Hills and former summer capital of British India in Himachal Pradesh, featuring pine-clad ridges, pedestrian mall roads, and heritage toy trains.",
    activities: [
      { name: "Kalka-Shimla UNESCO Toy Train Mountain Ride", category: "Sightseeing", cost: 10, durationMinutes: 300, rating: 4.9, description: "Travel on the historic narrow-gauge railway crossing 102 tunnels, 864 arched bridges, and pine valleys." },
      { name: "The Ridge & Christ Church Heritage Evening Walk", category: "Sightseeing", cost: 0, durationMinutes: 90, rating: 4.8, description: "Stroll the open ridge plaza overlooking the Shivalik range and view northern India's second oldest neo-Gothic church." },
      { name: "Jakhoo Temple Ropeway & Giant Hanuman Statue", category: "Adventure", cost: 8, durationMinutes: 90, rating: 4.7, description: "Ride the aerial cable car to Shimla's highest peak (2,455 m) crowned by a 108-foot colossal vermilion statue." },
      { name: "Viceregal Lodge (Rashtrapati Niwas) Tour", category: "Culture", cost: 4, durationMinutes: 120, rating: 4.8, description: "Tour the majestic Jacobethan-style stone mansion where pivotal pre-independence partition conferences were held." },
      { name: "Mall Road & Lakkar Bazaar Wooden Handicrafts", category: "Shopping", cost: 10, durationMinutes: 120, rating: 4.6, description: "Browse fragrant cedar wood walking sticks, antique brass collectibles, and woolen Kullu shawls." },
      { name: "Kufri Himalayan Nature Park & Yak Rides", category: "Wildlife", cost: 12, durationMinutes: 180, rating: 4.6, description: "Spot rare Himalayan monal pheasants, snow leopards, and musk deer surrounded by snowy peaks." },
    ],
  },
  {
    name: "Srinagar",
    country: "India",
    countryRegion: "Kashmir",
    costIndex: 2,
    popularityScore: 98,
    imageUrl: "https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=1200&auto=format&fit=crop",
    description: "Paradise on Earth in the Kashmir Valley, celebrated for carved cedar houseboats on Dal Lake, floating flower markets, and majestic terraced Mughal gardens.",
    activities: [
      { name: "Dal Lake Shikara Boat Ride & Floating Market", category: "Nature", cost: 10, durationMinutes: 120, rating: 5.0, description: "Glide gently past lotus beds in a hand-carved wooden canopy boat to witness the sunrise floating vegetable market." },
      { name: "Stay in a Heritage Handcrafted Cedar Houseboat", category: "Culture", cost: 50, durationMinutes: 720, rating: 4.9, description: "Experience royal Kashmiri hospitality with walnut wood paneling, embroidered carpets, and hot saffron Kahwa tea." },
      { name: "Nishat Bagh & Shalimar Bagh Terraced Mughal Gardens", category: "Sightseeing", cost: 3, durationMinutes: 150, rating: 4.9, description: "Walk through 12 tiered water channels, cascades, and ancient Chinar trees overlooking Dal Lake." },
      { name: "Traditional 36-Course Kashmiri Wazwan Feast", category: "Culinary", cost: 25, durationMinutes: 120, rating: 4.9, description: "Savor tender Rogan Josh, Gushtaba, Rista, and Tabak Maaz served in a royal engraved copper platter (Trami)." },
      { name: "Pashmina Shawl & Kashmiri Walnut Wood Craft Trail", category: "Shopping", cost: 30, durationMinutes: 120, rating: 4.8, description: "Watch master weavers spin 100% pure Pashmina wool and artisans hand-carve solid walnut wood screens." },
      { name: "Shankaracharya Hilltop Temple Panorama", category: "Spiritual", cost: 0, durationMinutes: 90, rating: 4.7, description: "Climb 243 stone steps to the 9th-century Shiva temple for 360-degree vistas of Srinagar city and Pir Panjal peaks." },
    ],
  },
  {
    name: "Leh",
    country: "India",
    costIndex: 3,
    popularityScore: 98,
    imageUrl: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=1200&auto=format&fit=crop",
    description: "The high-desert crown of Ladakh, surrounded by barren snow-capped Himalayan ridges, turquoise alpine lakes, and ancient Tibetan Buddhist monasteries.",
    activities: [
      { name: "Pangong Tso High-Altitude Turquoise Lake Expedition", category: "Nature", cost: 60, durationMinutes: 480, rating: 5.0, description: "Cross Chang La Pass to marvel at the 134-km long saline lake that shifts colors from emerald green to deep cobalt blue." },
      { name: "Nubra Valley & Hunder Sand Dunes Camel Safari", category: "Adventure", cost: 45, durationMinutes: 360, rating: 4.9, description: "Ride rare double-humped Bactrian camels amidst high-altitude desert sand dunes against snow-capped peaks." },
      { name: "Khardung La Pass (Highest Motorable Road)", category: "Adventure", cost: 20, durationMinutes: 180, rating: 4.9, description: "Stand at 5,359 meters (17,582 ft) above sea level with prayer flags fluttering against the Himalayan sky." },
      { name: "Thiksey Monastery Morning Prayer Chanting", category: "Spiritual", cost: 2, durationMinutes: 120, rating: 4.9, description: "Listen to monks chanting with deep resonant horns and view the magnificent 15-meter tall Maitreya Future Buddha statue." },
      { name: "Magnetic Hill & Indus-Zanskar Sangam Confluence", category: "Sightseeing", cost: 15, durationMinutes: 150, rating: 4.8, description: "Witness the gravity-defying optical illusion hill and the vivid color clash where the Indus and Zanskar rivers meet." },
      { name: "Leh Royal Palace & Shanti Stupa Sunset", category: "Culture", cost: 4, durationMinutes: 120, rating: 4.8, description: "Explore the 17th-century 9-storey royal palace and enjoy panoramic twilight views from the white-domed peace stupa." },
    ],
  },
  {
    name: "Rishikesh",
    country: "India",
    costIndex: 1,
    popularityScore: 97,
    imageUrl: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=1200&auto=format&fit=crop",
    description: "The Yoga Capital of the World on the foothills of the Himalayas in Uttarakhand, where the emerald Ganga emerges for river rafting, ashrams, and spiritual retreats.",
    activities: [
      { name: "White Water Rafting on the Holy Ganga (16 km)", category: "Adventure", cost: 18, durationMinutes: 180, rating: 4.9, description: "Navigate thrilling Grade III & IV rapids including 'Roller Coaster' and 'Golf Course' surrounded by lush Himalayan cliffs." },
      { name: "Parmarth Niketan Iconic Evening Ganga Aarti", category: "Spiritual", cost: 0, durationMinutes: 90, rating: 5.0, description: "Participate in universal prayer, singing, and floating flower diyas on the sacred waters beside the giant Shiva statue." },
      { name: "Beatles Ashram (Chaurasi Kutia) Murals Walk", category: "Culture", cost: 8, durationMinutes: 120, rating: 4.8, description: "Wander through the abandoned Maharishi Mahesh Yogi ashram where the Beatles composed the White Album in 1968." },
      { name: "Lakshman Jhula & Ram Jhula Suspension Bridges Walk", category: "Sightseeing", cost: 0, durationMinutes: 90, rating: 4.7, description: "Cross the historic pedestrian suspension bridges over the turquoise Ganges, browsing organic cafes and bookstores." },
      { name: "Cliff Jumping & Riverside Campfire by the Beach", category: "Adventure", cost: 25, durationMinutes: 240, rating: 4.8, description: "Jump from a 30-foot river rock into the rapids and spend the evening stargazing around a beach campfire." },
      { name: "Sunrise Yoga & Guided Pranayama Meditation", category: "Spiritual", cost: 10, durationMinutes: 90, rating: 4.9, description: "Practice authentic Hatha yoga and breathwork on peaceful riverside open-air platforms facing the mountains." },
    ],
  },
  {
    name: "Dehradun",
    country: "India",
    costIndex: 1,
    popularityScore: 90,
    imageUrl: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=1200&auto=format&fit=crop",
    description: "The scenic Doon Valley capital of Uttarakhand nestled between the Ganga and Yamuna rivers, celebrated for elite academies, caves, and bakery trails.",
    activities: [
      { name: "Robber's Cave (Guchhupani) Riverbed Canyon Walk", category: "Nature", cost: 3, durationMinutes: 120, rating: 4.8, description: "Wade through ankle-deep ice-cold stream waters through a narrow limestone canyon where underground springs erupt." },
      { name: "Forest Research Institute (FRI) Greco-Roman Complex", category: "Culture", cost: 3, durationMinutes: 150, rating: 4.8, description: "Tour the colossal colonial brick edifice larger than Buckingham Palace, featuring forestry museums and cedar avenues." },
      { name: "Mindrolling Monastery & Great Stupa of Clement Town", category: "Spiritual", cost: 0, durationMinutes: 90, rating: 4.8, description: "Admire the 60-meter high Tibetan Buddhist stupa adorned with gold murals, prayer wheels, and serene gardens." },
      { name: "Sahastradhara Sulphur Springs & Ropeway", category: "Nature", cost: 5, durationMinutes: 120, rating: 4.6, description: "Bathe in natural thousands-fold therapeutic limestone waterfalls and ride the cable car to mountaintop viewpoints." },
      { name: "Paltan Bazaar Bakery Trail & Sticky Toffee / Rusks", category: "Culinary", cost: 6, durationMinutes: 90, rating: 4.7, description: "Sample famous Dehradun bakery butter biscuits, pistachio pastries, and fresh litchi fruit in season." },
      { name: "Tapkeshwar Mahadev River Cave Temple", category: "Spiritual", cost: 0, durationMinutes: 60, rating: 4.7, description: "Visit the natural cave shrine where mineral water drips continuously on the holy Shiva lingam." },
    ],
  },
  {
    name: "Darjeeling",
    country: "India",
    costIndex: 2,
    popularityScore: 95,
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop",
    description: "The Queen of the Hills in West Bengal, celebrated for panoramic views of Mount Kanchenjunga, emerald tea estates, and colonial toy train loops.",
    activities: [
      { name: "Tiger Hill Mount Kanchenjunga Sunrise Panorama", category: "Sightseeing", cost: 5, durationMinutes: 150, rating: 4.9, description: "Watch first rays of sunlight paint the world's third highest peak in dazzling gold and coral tones." },
      { name: "Darjeeling Himalayan Railway Toy Train Joyride", category: "Sightseeing", cost: 14, durationMinutes: 120, rating: 4.9, description: "Ride the century-old steam engine puffing through Batasia Loop and high mountain towns." },
      { name: "Happy Valley Tea Estate Plucking & Tasting Tour", category: "Culinary", cost: 8, durationMinutes: 90, rating: 4.8, description: "Learn how the 'Champagne of Teas' is harvested, processed, and savor fresh floral first-flush brews." },
      { name: "Padmaja Naidu Himalayan Zoo & Snow Leopard Center", category: "Wildlife", cost: 4, durationMinutes: 120, rating: 4.8, description: "Observe rare high-altitude Himalayan wildlife including Red Pandas, Snow Leopards, and Tibetan Wolves." },
      { name: "Batasia Loop & Gorkha War Memorial Garden", category: "Sightseeing", cost: 2, durationMinutes: 60, rating: 4.7, description: "Marvel at the ingenious 360-degree railway engineering loop surrounded by manicured flowerbeds." },
      { name: "Japanese Peace Pagoda & Buddhist Temple Meditation", category: "Spiritual", cost: 0, durationMinutes: 60, rating: 4.7, description: "Walk the peaceful pine forest path to the gleaming white stupa with four carved avatars of Lord Buddha." },
    ],
  },
  {
    name: "Ooty",
    country: "India",
    costIndex: 2,
    popularityScore: 93,
    imageUrl: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?q=80&w=1200&auto=format&fit=crop",
    description: "The Queen of Hill Stations in the Nilgiri Blue Mountains of Tamil Nadu, famous for eucalyptus forests, tea gardens, and heritage steam trains.",
    activities: [
      { name: "Nilgiri Mountain Railway Steam Heritage Train", category: "Sightseeing", cost: 8, durationMinutes: 240, rating: 4.9, description: "Ride the UNESCO rack-and-pinion steam train ascending through dark tunnels, waterfall ravines, and tea slopes." },
      { name: "Ooty Government Botanical Gardens & Fossil Tree", category: "Nature", cost: 3, durationMinutes: 120, rating: 4.7, description: "Walk among 650 species of exotic flora, lush Italian gardens, and a 20-million-year-old fossilized tree trunk." },
      { name: "Doddabetta Peak Nilgiri Mountain Observation Dome", category: "Sightseeing", cost: 2, durationMinutes: 90, rating: 4.7, description: "Look through telescopes from the highest peak in the Nilgiris (2,637 m) across misty valleys and tea plantations." },
      { name: "Pykara Lake Speedboating & Pykara Waterfalls", category: "Adventure", cost: 10, durationMinutes: 150, rating: 4.8, description: "Speedboat across clean protected forest waters and hike to the cascading terraced waterfalls." },
      { name: "Ooty Homemade Chocolate & Tea Factory Tour", category: "Culinary", cost: 4, durationMinutes: 75, rating: 4.7, description: "Watch artisan chocolatiers create almond truffles and sample freshly crushed Nilgiri green and black teas." },
      { name: "Avalanche Lake & Sanctuary Nature Safari", category: "Nature", cost: 12, durationMinutes: 210, rating: 4.8, description: "Take a forest department vehicle into pristine trout-filled lakes surrounded by rhododendrons and shola forests." },
    ],
  },
  {
    name: "Munnar",
    country: "India",
    costIndex: 2,
    popularityScore: 96,
    imageUrl: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=80&w=1200&auto=format&fit=crop",
    description: "The rolling tea garden paradise of the Western Ghats in Kerala, veiled in misty hills, endangered Nilgiri Tahrs, and aromatic spice valleys.",
    activities: [
      { name: "Eravikulam National Park Nilgiri Tahr Safari", category: "Wildlife", cost: 10, durationMinutes: 180, rating: 4.9, description: "Spot the endangered Nilgiri Tahr mountain goat on the slopes of Anamudi, South India's highest peak (2,695 m)." },
      { name: "Kolukkumalai Sunrise at World's Highest Tea Estate", category: "Nature", cost: 25, durationMinutes: 240, rating: 5.0, description: "Take a rugged 4x4 jeep safari to 7,900 ft to watch golden clouds roll over dramatic mountain cliffs." },
      { name: "KDHP Tea Museum & Orthodox Factory Tour", category: "Culinary", cost: 4, durationMinutes: 90, rating: 4.8, description: "Discover the history of Munnar's tea plantations and taste artisanal white, green, and black leaf brews." },
      { name: "Mattupetty Dam & Eco Point Echo Walks", category: "Nature", cost: 5, durationMinutes: 120, rating: 4.6, description: "Yell into the natural mountain amphitheater, hear your echo bounce across the lake, and watch wild elephants." },
      { name: "Attukad Waterfalls Jungle Hike", category: "Adventure", cost: 0, durationMinutes: 120, rating: 4.7, description: "Trek through lush cardamom forests and wooden bridges to admire roaring cascades in a rocky gorge." },
      { name: "Pothamedu Viewpoint Sunset Walk", category: "Sightseeing", cost: 0, durationMinutes: 75, rating: 4.7, description: "Enjoy panoramic sunset views over endless emerald green rolling tea carpets and misty mountain roads." },
    ],
  },
  {
    name: "Pondicherry",
    country: "India",
    costIndex: 2,
    popularityScore: 94,
    imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1200&auto=format&fit=crop",
    description: "The French Riviera of the East on the Bay of Bengal, featuring mustard-yellow colonial villas, tranquil ashrams, experimental townships, and coastal promenades.",
    activities: [
      { name: "White Town (French Quarter) Heritage Bicycle Tour", category: "Culture", cost: 6, durationMinutes: 120, rating: 4.9, description: "Pedal along clean bougainvillea-draped avenues, pastel yellow villas, and colonial street names (Rues)." },
      { name: "Auroville Matrimandir Golden Meditation Sphere", category: "Spiritual", cost: 0, durationMinutes: 180, rating: 4.9, description: "Experience deep silence inside the world's largest crystal meditation chamber in the experimental universal town." },
      { name: "Promenade Beach Rock Walk & Sunset Pier", category: "Sightseeing", cost: 0, durationMinutes: 90, rating: 4.8, description: "Stroll the vehicle-free seaside promenade past the French War Memorial and Gandhi Statue." },
      { name: "Sri Aurobindo Ashram Peaceful Visit", category: "Spiritual", cost: 0, durationMinutes: 60, rating: 4.8, description: "Spend quiet moments around the flower-bedecked marble Samadhi of Sri Aurobindo and The Mother." },
      { name: "French Creperie & Artisan Bakery Trail", category: "Culinary", cost: 12, durationMinutes: 90, rating: 4.8, description: "Taste authentic butter croissants, buckwheat galettes, croque monsieur, and artisanal sourdough baguettes." },
      { name: "Serenity Beach Morning Surfing Lesson", category: "Adventure", cost: 20, durationMinutes: 120, rating: 4.7, description: "Learn wave riding with certified surf instructors on gentle Bay of Bengal beach breaks." },
    ],
  },
  {
    name: "Port Blair",
    country: "India",
    costIndex: 3,
    popularityScore: 93,
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop",
    description: "The tropical gateway to the Andaman & Nicobar archipelago, surrounded by turquoise coral reefs, historical colonial ruins, and bioluminescent bays.",
    activities: [
      { name: "Cellular Jail National Memorial & Light-Sound Show", category: "Culture", cost: 5, durationMinutes: 150, rating: 4.9, description: "Tour the historic seven-winged colonial prison (Kala Pani) and hear the stirring saga of freedom fighters." },
      { name: "Ross Island (Netaji Subhash) British Ruins & Deer", category: "Culture", cost: 10, durationMinutes: 180, rating: 4.8, description: "Explore banyan tree roots engulfing British ballrooms, churches, and spot friendly wild spotted deer." },
      { name: "Havelock Island (Swaraj Dweep) Radhanagar Beach", category: "Nature", cost: 35, durationMinutes: 480, rating: 5.0, description: "Spend the day on Asia's finest pristine white sand beach with turquoise crystalline waters." },
      { name: "Elephant Beach Coral Snorkeling & Sea Walking", category: "Adventure", cost: 40, durationMinutes: 180, rating: 4.9, description: "Walk on the ocean floor wearing an air helmet surrounded by clownfish, sea turtles, and brain corals." },
      { name: "Chidiya Tapu Sunset Point & Bird Watching", category: "Nature", cost: 8, durationMinutes: 120, rating: 4.7, description: "Watch vibrant tropical birds amidst mangrove creeks and catch the finest sunset in South Andaman." },
      { name: "Samudrika Naval Marine Museum", category: "Wildlife", cost: 3, durationMinutes: 60, rating: 4.6, description: "Discover rare shells, giant coral skeletons, sea turtles, and tribal history of the Andaman archipelago." },
    ],
  },
  {
    name: "Jaisalmer",
    country: "India",
    costIndex: 2,
    popularityScore: 95,
    imageUrl: "https://images.unsplash.com/photo-1576487248805-acf45f536b43?q=80&w=1200&auto=format&fit=crop",
    description: "The Golden City in the heart of the Great Thar Desert of Rajasthan, renowned for its living golden sandstone fort, desert dunes, and carved havelis.",
    activities: [
      { name: "Jaisalmer Fort (Sonar Qila) Living Citadel Tour", category: "Culture", cost: 5, durationMinutes: 150, rating: 4.9, description: "Walk inside one of the world's few fully inhabited forts, housing 4,000 residents, Jain temples, and rooftop cafes." },
      { name: "Sam Sand Dunes Camel Safari & Sunset Camp", category: "Adventure", cost: 30, durationMinutes: 300, rating: 4.9, description: "Ride camels across golden rippling sand dunes, watch folk fire dancers, and sleep under desert stars." },
      { name: "Patwon Ki Haveli Filigree Sandstone Architecture", category: "Culture", cost: 4, durationMinutes: 90, rating: 4.8, description: "Marvel at a cluster of five 18th-century merchant mansions featuring 60 intricate carved stone jharokhas." },
      { name: "Gadisar Lake Desert Oasis & Boating", category: "Sightseeing", cost: 4, durationMinutes: 75, rating: 4.7, description: "Row across the 14th-century artificial rainwater lake surrounded by yellow sandstone shrines and gateways." },
      { name: "Kuldhara Abandoned Ghost Village Mystery", category: "Sightseeing", cost: 4, durationMinutes: 90, rating: 4.6, description: "Walk through the eerie ruins of a village cursed and abandoned overnight by Paliwal Brahmins in 1825." },
      { name: "Desert Cultural Centre Rajasthani Puppet Show", category: "Culture", cost: 3, durationMinutes: 60, rating: 4.7, description: "Enjoy traditional Kathputli puppet storytelling and traditional folk music performance." },
    ],
  },

  // =========================================================================
  // 2. INTERNATIONAL BALANCED CATALOG (12 Major Global Destinations)
  // =========================================================================
  {
    name: "Kyoto",
    country: "Japan",
    costIndex: 3,
    popularityScore: 98,
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop",
    description: "Ancient imperial temples, serene bamboo groves, traditional machiya teahouses, and centuries-old artisan traditions.",
    activities: [
      { name: "Fushimi Inari Shrine Dawn Walk", category: "Culture", cost: 0, durationMinutes: 150, rating: 4.9, description: "Walk through thousands of vibrant vermilion torii gates winding up Mount Inari." },
      { name: "Traditional Tea Ceremony in Gion", category: "Culinary", cost: 45, durationMinutes: 90, rating: 4.8, description: "Experience ceremonial matcha preparation inside a historic preserved wooden teahouse." },
      { name: "Arashiyama Bamboo Grove & Tenryu-ji", category: "Nature", cost: 10, durationMinutes: 120, rating: 4.7, description: "Wander towering emerald stalks and a UNESCO World Heritage Zen garden." },
      { name: "Kinkaku-ji (Golden Pavilion) Visit", category: "Sightseeing", cost: 8, durationMinutes: 60, rating: 4.8, description: "Admire the top two floors completely covered in brilliant gold leaf overlooking the mirror pond." },
      { name: "Nishiki Market Culinary Exploration", category: "Culinary", cost: 30, durationMinutes: 120, rating: 4.6, description: "Sample local skewers, dashi tamago, fresh mochi, and Kyoto street specialties." },
      { name: "Philosopher's Path Canal Stroll", category: "Nature", cost: 0, durationMinutes: 75, rating: 4.7, description: "A peaceful stone path along a cherry-tree lined canal passing historic sub-temples." },
    ],
  },
  {
    name: "Florence",
    country: "Italy",
    costIndex: 3,
    popularityScore: 96,
    imageUrl: "https://images.unsplash.com/photo-1543429776-2782fc8e1acd?q=80&w=1200&auto=format&fit=crop",
    description: "Renaissance masterpieces, cobblestone corridors, sunset views over the Ponte Vecchio, and Tuscan culinary heritage.",
    activities: [
      { name: "Uffizi Gallery Renaissance Masterpieces", category: "Culture", cost: 26, durationMinutes: 180, rating: 4.9, description: "Botticelli's Birth of Venus, Da Vinci, Michelangelo, and Caravaggio in a grand palace." },
      { name: "Climb the Duomo Cupola", category: "Sightseeing", cost: 30, durationMinutes: 90, rating: 4.8, description: "Ascend 463 steps inside Brunelleschi's revolutionary dome for 360° Tuscan panoramas." },
      { name: "Sunset at Piazzale Michelangelo", category: "Sightseeing", cost: 0, durationMinutes: 90, rating: 4.9, description: "The iconic skyline panorama overlooking Florence and the Arno River at golden hour." },
      { name: "Tuscan Pasta Making Workshop", category: "Culinary", cost: 75, durationMinutes: 180, rating: 4.9, description: "Hand-roll fresh tagliatelle and ravioli paired with Chianti Classico wine." },
      { name: "Ponte Vecchio & Oltrarno Artisan Walk", category: "Culture", cost: 0, durationMinutes: 90, rating: 4.6, description: "Browse traditional leather, marbling, and goldsmith workshops on the south bank." },
      { name: "Mercato Centrale Gastronomy Tour", category: "Culinary", cost: 35, durationMinutes: 90, rating: 4.7, description: "Taste fresh burrata, lampredotto, Tuscan truffles, and artisanal gelato." },
    ],
  },
  {
    name: "Oaxaca",
    country: "Mexico",
    costIndex: 2,
    popularityScore: 92,
    imageUrl: "https://images.unsplash.com/photo-1512815046277-22a4666f81e3?q=80&w=1200&auto=format&fit=crop",
    description: "Rich Zapotec architecture, indigenous craft markets, renowned mole varieties, and vibrant artisanal mezcal distilleries.",
    activities: [
      { name: "Monte Albán Zapotec Ruins", category: "Culture", cost: 12, durationMinutes: 180, rating: 4.8, description: "Ancient mountaintop ceremonial center with sweeping vistas of the Oaxaca Valley." },
      { name: "Traditional 7 Moles Tasting Experience", category: "Culinary", cost: 50, durationMinutes: 120, rating: 4.9, description: "Explore Negro, Coloradito, Amarillo, and Verde moles with local chefs." },
      { name: "Hierve el Agua Petrified Waterfalls", category: "Nature", cost: 25, durationMinutes: 240, rating: 4.7, description: "Natural rock formations resembling cascading water with cliff-edge infinity pools." },
      { name: "Artisanal Mezcal Palenque Tour", category: "Culinary", cost: 40, durationMinutes: 150, rating: 4.9, description: "Discover agave harvesting, pit roasting, and copper distillation in Santiago Matatlán." },
      { name: "San Bartolo Coyotepec Black Clay Craft", category: "Culture", cost: 15, durationMinutes: 90, rating: 4.6, description: "Watch master potters burnish ancient Barro Negro pottery with quartz stones." },
      { name: "Templo de Santo Domingo & Ethnobotanical Garden", category: "Sightseeing", cost: 10, durationMinutes: 100, rating: 4.8, description: "Baroque gold leaf interiors and hundreds of rare native desert cacti species." },
    ],
  },
  {
    name: "Barcelona",
    country: "Spain",
    costIndex: 3,
    popularityScore: 97,
    imageUrl: "https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=1200&auto=format&fit=crop",
    description: "Modernist Gaudi marvels, sun-drenched Mediterranean coastline, Gothic quarters, and bustling neighborhood tapas bars.",
    activities: [
      { name: "Sagrada Família Architectural Tour", category: "Culture", cost: 32, durationMinutes: 120, rating: 4.9, description: "Gaudi's soaring basilica with forest-like columns and kaleidoscopic stained glass." },
      { name: "Park Güell Mosaic Terraces", category: "Sightseeing", cost: 15, durationMinutes: 90, rating: 4.7, description: "Whimsical gingerbread pavilions and serpentine ceramic benches overlooking the city." },
      { name: "Gothic Quarter Tapas & Wine Route", category: "Culinary", cost: 55, durationMinutes: 150, rating: 4.8, description: "Sample Jamón Ibérico, Patatas Bravas, Pan con Tomate, and crisp Cava." },
      { name: "Barceloneta Beach Sunset Promenade", category: "Nature", cost: 0, durationMinutes: 75, rating: 4.6, description: "Stroll the Mediterranean boardwalk from the W Hotel to Port Olímpic." },
      { name: "Casa Batlló Immersive Audio Experience", category: "Culture", cost: 35, durationMinutes: 75, rating: 4.8, description: "Explore the dragon-back roof and marine-inspired interiors of Gaudi's masterpiece." },
      { name: "La Boqueria Food Market", category: "Culinary", cost: 20, durationMinutes: 60, rating: 4.7, description: "Vibrant fruit smoothies, manchego cheese cones, and fresh Mediterranean seafood." },
    ],
  },
  {
    name: "Reykjavik",
    country: "Iceland",
    costIndex: 4,
    popularityScore: 94,
    imageUrl: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?q=80&w=1200&auto=format&fit=crop",
    description: "Gateway to geothermal lagoons, volcanic lava fields, dramatic cascading waterfalls, and nocturnal aurora displays.",
    activities: [
      { name: "Golden Circle & Thingvellir Rift Valley", category: "Nature", cost: 85, durationMinutes: 360, rating: 4.9, description: "Gullfoss waterfall, Strokkur geyser eruptions, and the Eurasian/North American tectonic divide." },
      { name: "Blue Lagoon Geothermal Spa", category: "Adventure", cost: 95, durationMinutes: 180, rating: 4.8, description: "Mineral-rich silica mud masks in soothing milky-blue geothermal waters." },
      { name: "Northern Lights Night Expedition", category: "Adventure", cost: 70, durationMinutes: 240, rating: 4.7, description: "Track solar wind activity away from city light pollution to photograph aurora borealis." },
      { name: "Hallgrímskirkja Tower Viewpoint", category: "Sightseeing", cost: 10, durationMinutes: 45, rating: 4.7, description: "Basalt column inspired cathedral offering sweeping views of colorful Reykjavik rooftops." },
      { name: "Whale Watching in Faxaflói Bay", category: "Nature", cost: 90, durationMinutes: 180, rating: 4.6, description: "Spot humpback whales, minke whales, white-beaked dolphins, and puffins." },
      { name: "South Coast Waterfalls & Black Sand Beach", category: "Nature", cost: 110, durationMinutes: 480, rating: 4.9, description: "Walk behind Seljalandsfoss, witness Skógafoss, and admire Reynisfjara basalt stacks." },
    ],
  },
  {
    name: "Cape Town",
    country: "South Africa",
    costIndex: 2,
    popularityScore: 93,
    imageUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=1200&auto=format&fit=crop",
    description: "Dramatic Table Mountain panoramas, rugged peninsula coastlines, world-class vineyard valleys, and coastal penguin colonies.",
    activities: [
      { name: "Table Mountain Aerial Cableway", category: "Sightseeing", cost: 25, durationMinutes: 120, rating: 4.9, description: "Ascend the 360-degree revolving cable car to the flat-topped summit." },
      { name: "Boulders Beach African Penguin Colony", category: "Nature", cost: 15, durationMinutes: 90, rating: 4.8, description: "Boardwalk views of wild nesting jackass penguins on protected granite beaches." },
      { name: "Cape Point & Cape of Good Hope Trail", category: "Adventure", cost: 20, durationMinutes: 240, rating: 4.8, description: "Hike dramatic ocean cliffs where the Atlantic and Indian oceans meet." },
      { name: "Stellenbosch Vineyard Wine & Cheese Tasting", category: "Culinary", cost: 45, durationMinutes: 300, rating: 4.9, description: "Sample Pinotage and Chenin Blanc in the historic Cape Dutch wine valleys." },
      { name: "Bo-Kaap Cultural Walk & Cape Malay Cooking", category: "Culture", cost: 40, durationMinutes: 120, rating: 4.7, description: "Explore pastel-painted cobbled streets and cook fragrant bobotie and samosas." },
      { name: "Kirstenbosch National Botanical Garden", category: "Nature", cost: 12, durationMinutes: 120, rating: 4.8, description: "Canopy Boomslang walkway above indigenous fynbos flora on the slopes of Table Mountain." },
    ],
  },
  {
    name: "Paris",
    country: "France",
    costIndex: 3,
    popularityScore: 99,
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop",
    description: "The City of Light along the Seine River, celebrated for world-class haute cuisine, iconic iron monuments, and impressionist art collections.",
    activities: [
      { name: "Eiffel Tower Summit & Champagne View", category: "Sightseeing", cost: 32, durationMinutes: 120, rating: 4.9, description: "Ride the glass elevators to 276 meters for panoramic views of Paris and the Champ de Mars." },
      { name: "Louvre Museum Masterpieces with Mona Lisa", category: "Culture", cost: 22, durationMinutes: 240, rating: 4.9, description: "Explore the world's largest art museum from ancient Egyptian antiquities to the Winged Victory of Samothrace." },
      { name: "Seine River Twilight Cruise on Bateaux Mouches", category: "Sightseeing", cost: 18, durationMinutes: 75, rating: 4.8, description: "Float past the illuminated Notre-Dame Cathedral, Musée d'Orsay, and historic stone bridges." },
      { name: "Montmartre & Sacré-Cœur Artist Quarter Walk", category: "Culture", cost: 0, durationMinutes: 120, rating: 4.7, description: "Climb the steps to the white basilica and visit Place du Tertre where painters set up outdoor easels." },
      { name: "Saint-Germain Bakery & Patisserie Tasting", category: "Culinary", cost: 30, durationMinutes: 90, rating: 4.9, description: "Taste fresh buttery croissants, pastel macarons, and chocolate éclairs in historic tea salons." },
      { name: "Musée d'Orsay Impressionist Art Tour", category: "Culture", cost: 18, durationMinutes: 150, rating: 4.8, description: "Admire Monet's water lilies, Van Gogh's Starry Night, and Degas' dancers in the converted Beaux-Arts railway station." },
    ],
  },
  {
    name: "Dubai",
    country: "United Arab Emirates",
    costIndex: 4,
    popularityScore: 97,
    imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop",
    description: "Futuristic desert metropolis on the Persian Gulf, celebrated for record-breaking architectural skyscrapers, luxury island archipelagos, and heritage souks.",
    activities: [
      { name: "Burj Khalifa 'At the Top' Observation Deck", category: "Sightseeing", cost: 50, durationMinutes: 90, rating: 4.9, description: "Look out from the 124th & 148th floors of the world's tallest building over the Dubai Fountain." },
      { name: "Red Dunes Desert Safari with BBQ Dinner", category: "Adventure", cost: 55, durationMinutes: 360, rating: 4.9, description: "Dune bash in 4x4 Land Cruisers, sandboard red dunes, and enjoy belly dancing under the desert stars." },
      { name: "Dubai Creek Traditional Abra Ride & Gold Souk", category: "Shopping", cost: 5, durationMinutes: 120, rating: 4.7, description: "Cross the historic waterway on a 1-dirham wooden boat to shop for glittering gold jewelry and spices." },
      { name: "Dubai Marina Yacht Sunset Cruise", category: "Sightseeing", cost: 45, durationMinutes: 120, rating: 4.8, description: "Sail past illuminated futuristic high-rises, Bluewaters Island, and Ain Dubai ferris wheel." },
      { name: "Museum of the Future Interactive Experience", category: "Culture", cost: 40, durationMinutes: 150, rating: 4.8, description: "Explore visionary exhibitions on space travel, bioengineering, and ecosystems inside the calligraphy ring building." },
      { name: "Dubai Mall Aquarium & Underwater Zoo Walk", category: "Wildlife", cost: 35, durationMinutes: 90, rating: 4.7, description: "Walk through the 270-degree acrylic tunnel surrounded by sand tiger sharks and giant stingrays." },
    ],
  },
  {
    name: "Bangkok",
    country: "Thailand",
    costIndex: 1,
    popularityScore: 98,
    imageUrl: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=1200&auto=format&fit=crop",
    description: "The vibrant capital of Thailand along the Chao Phraya River, pulsating with ornate gilded Buddhist temples, floating markets, and legendary street food.",
    activities: [
      { name: "Grand Palace & Temple of the Emerald Buddha", category: "Culture", cost: 15, durationMinutes: 180, rating: 4.9, description: "Tour the breathtaking royal residence and admire the sacred jade-carved Emerald Buddha in Wat Phra Kaew." },
      { name: "Wat Arun (Temple of Dawn) River Viewpoint", category: "Sightseeing", cost: 3, durationMinutes: 75, rating: 4.8, description: "Climb the steep porcelain-encrusted spire overlooking the bustling Chao Phraya River." },
      { name: "Chinatown (Yaowarat) Street Food Night Safari", category: "Culinary", cost: 15, durationMinutes: 150, rating: 4.9, description: "Sample famous Michelin-starred crab omelets, pad thai, crispy pork belly, and sweet mango sticky rice." },
      { name: "Chatuchak Weekend Market Souvenir Shopping", category: "Shopping", cost: 20, durationMinutes: 240, rating: 4.7, description: "Browse 15,000 stalls offering handmade silk crafts, vintage clothing, ceramics, and Thai spices." },
      { name: "Damnoen Saduak Floating Market Longtail Boat", category: "Culture", cost: 25, durationMinutes: 300, rating: 4.6, description: "Navigate wooden canals where vendors sell tropical fruits and hot noodle soup directly from wooden boats." },
      { name: "Traditional Thai Massage at Wat Pho", category: "Spiritual", cost: 18, durationMinutes: 90, rating: 4.9, description: "Experience therapeutic acupressure inside the historical birthplace of traditional Thai medical massage." },
    ],
  },
  {
    name: "New York",
    country: "USA",
    costIndex: 4,
    popularityScore: 99,
    imageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1200&auto=format&fit=crop",
    description: "The iconic global metropolis of towering skyscrapers, Broadway theater, Central Park greenery, and 24-hour urban energy.",
    activities: [
      { name: "Central Park Morning Bicycle & Lake Tour", category: "Nature", cost: 20, durationMinutes: 150, rating: 4.9, description: "Cycle past Strawberry Fields, Bethesda Terrace, Bow Bridge, and the Great Lawn." },
      { name: "Top of the Rock Observation Deck at Sunset", category: "Sightseeing", cost: 40, durationMinutes: 90, rating: 4.9, description: "View the Empire State Building framed against the Manhattan skyline from Rockefeller Center." },
      { name: "Statue of Liberty & Ellis Island Immigration Museum", category: "Culture", cost: 25, durationMinutes: 240, rating: 4.8, description: "Take the harbor ferry to Lady Liberty and explore millions of ancestral immigration records." },
      { name: "The High Line & Chelsea Market Food Hall Walk", category: "Culinary", cost: 25, durationMinutes: 120, rating: 4.8, description: "Walk the elevated railroad park above meatpacking streets and sample fresh Maine lobster rolls and tacos." },
      { name: "Broadway Musical Show in Times Square", category: "Culture", cost: 95, durationMinutes: 180, rating: 4.9, description: "Experience world-class live theater, choreography, and orchestral music in the historic Theater District." },
      { name: "Metropolitan Museum of Art (The Met)", category: "Culture", cost: 30, durationMinutes: 240, rating: 5.0, description: "Walk through the Temple of Dendur, European master paintings, and American wing sculpture courts." },
    ],
  },
  {
    name: "Los Angeles",
    country: "USA",
    costIndex: 4,
    popularityScore: 97,
    imageUrl: "https://images.unsplash.com/photo-1580655653885-65763b2597d0?q=80&w=1200&auto=format&fit=crop",
    description: "The entertainment capital of the world in Southern California, renowned for Hollywood glamour, Pacific beaches, and vibrant arts.",
    activities: [
      { name: "Griffith Observatory & Hollywood Sign Vista", category: "Sightseeing", cost: 0, durationMinutes: 120, rating: 4.9, description: "Enjoy iconic hilltop views of the Hollywood Sign and planetary exhibits." },
      { name: "Santa Monica Pier & Venice Boardwalk Bike Ride", category: "Nature", cost: 15, durationMinutes: 180, rating: 4.8, description: "Cruise along the Pacific coast bike path between the historic pier and bohemian Venice canals." },
      { name: "Getty Center Art & Pacific Garden Tour", category: "Culture", cost: 0, durationMinutes: 210, rating: 4.9, description: "Tour Richard Meier's hilltop museum housing masterpieces by Van Gogh, Monet, and Rembrandt." },
      { name: "Universal Studios Hollywood Studio Backlot Tour", category: "Adventure", cost: 109, durationMinutes: 300, rating: 4.8, description: "Go behind the scenes of legendary movie sets and thrilling immersive theme park rides." },
    ],
  },
  {
    name: "Chicago",
    country: "USA",
    costIndex: 3,
    popularityScore: 95,
    imageUrl: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?q=80&w=1200&auto=format&fit=crop",
    description: "The Windy City on Lake Michigan, famous for bold skyscraper architecture, deep-dish pizza, and magnificent lakefront parks.",
    activities: [
      { name: "Chicago Architecture Center River Cruise", category: "Sightseeing", cost: 52, durationMinutes: 90, rating: 4.9, description: "Cruise the Chicago River while docents decode more than 50 iconic skyscrapers." },
      { name: "Millennium Park & 'The Bean' Cloud Gate", category: "Sightseeing", cost: 0, durationMinutes: 60, rating: 4.8, description: "Photograph distorted city reflections in Anish Kapoor's famous stainless steel sculpture." },
      { name: "Art Institute of Chicago Gallery Walk", category: "Culture", cost: 30, durationMinutes: 180, rating: 4.9, description: "Stand in front of Seurat's Sunday on La Grande Jatte and Edward Hopper's Nighthawks." },
      { name: "Deep Dish Pizza Tasting at Lou Malnati's", category: "Culinary", cost: 25, durationMinutes: 90, rating: 4.8, description: "Savor authentic Chicago buttercrust deep dish pizza loaded with rich tomato sauce and mozzarella." },
    ],
  },
  {
    name: "San Francisco",
    country: "USA",
    costIndex: 4,
    popularityScore: 96,
    imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1200&auto=format&fit=crop",
    description: "The picturesque City by the Bay, celebrated for the Golden Gate Bridge, historic cable cars, colorful Victorian houses, and gourmet dining.",
    activities: [
      { name: "Golden Gate Bridge Walk & Marin Headlands Vista", category: "Sightseeing", cost: 0, durationMinutes: 150, rating: 4.9, description: "Walk across the 1.7-mile suspension bridge overlooking the Pacific and San Francisco Bay." },
      { name: "Alcatraz Island Penitentiary Night Tour", category: "Culture", cost: 55, durationMinutes: 180, rating: 4.9, description: "Take the ferry to the historic maximum security federal prison and listen to inmate audio guides." },
      { name: "Fisherman's Wharf Clam Chowder & Sea Lions", category: "Culinary", cost: 18, durationMinutes: 90, rating: 4.7, description: "Enjoy sourdough bread bowl clam chowder at Pier 39 while watching sunbathing sea lions." },
      { name: "Historic Cable Car Ride over Nob Hill", category: "Sightseeing", cost: 8, durationMinutes: 45, rating: 4.8, description: "Hang on to the wooden running boards of the world's last manually operated cable car system." },
    ],
  },
  {
    name: "Cairo",
    country: "Egypt",
    costIndex: 1,
    popularityScore: 96,
    imageUrl: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?q=80&w=1200&auto=format&fit=crop",
    description: "The cradle of ancient civilization on the Nile River, guarded by the Great Pyramids of Giza, the Sphinx, and medieval Islamic quarters.",
    activities: [
      { name: "Great Pyramids of Giza & Great Sphinx Camel Trek", category: "Sightseeing", cost: 20, durationMinutes: 240, rating: 5.0, description: "Stand beneath Khufu's 4,500-year-old pyramid and ride camels across desert dunes with ancient panoramic views." },
      { name: "Grand Egyptian Museum (GEM) & King Tut Treasures", category: "Culture", cost: 25, durationMinutes: 210, rating: 4.9, description: "Marvel at King Tutankhamun's solid gold death mask, royal chariots, and colossal statues of Ramses II." },
      { name: "Khan el-Khalili Medieval Souk Spice & Lantern Walk", category: "Shopping", cost: 10, durationMinutes: 150, rating: 4.8, description: "Explore 14th-century arched alleys filled with colored glass lamps, perfume essences, and brass shisha pipes." },
      { name: "Traditional Felucca Sunset Sail on the River Nile", category: "Nature", cost: 15, durationMinutes: 90, rating: 4.8, description: "Sail on an authentic wooden canvas boat enjoying cool evening breezes on the world's longest river." },
      { name: "Saladin Citadel & Mosque of Muhammad Ali", category: "Culture", cost: 12, durationMinutes: 120, rating: 4.7, description: "Tour the alabaster mosque atop the medieval fortress offering skyline views of Cairo and distant pyramids." },
      { name: "Authentic Egyptian Koshary Feast at Abou Tarek", category: "Culinary", cost: 5, durationMinutes: 60, rating: 4.9, description: "Taste Cairo's beloved national comfort food of rice, lentils, macaroni, chickpeas, and crispy fried onions in spicy garlic sauce." },
    ],
  },
  {
    name: "Bali",
    country: "Indonesia",
    costIndex: 2,
    popularityScore: 98,
    imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop",
    description: "The Island of the Gods in Indonesia, enchanted by emerald terraced rice paddies, cliff-edge sea temples, volcanic sunrises, and spiritual retreats.",
    activities: [
      { name: "Ubud Tegallalang Rice Terraces & Jungle Swing", category: "Nature", cost: 15, durationMinutes: 150, rating: 4.9, description: "Walk along the ancient Subak irrigation rice terraces and soar high over the palm canopy on a jungle swing." },
      { name: "Uluwatu Cliff Temple & Kecak Fire Dance at Sunset", category: "Culture", cost: 18, durationMinutes: 150, rating: 4.9, description: "Watch 50 chanting dancers perform the Ramayana epic on a 70-meter cliff above crashing Indian Ocean waves." },
      { name: "Mount Batur Sunrise Volcano Trek & Hot Springs", category: "Adventure", cost: 45, durationMinutes: 360, rating: 4.9, description: "Hike under starlight to eat eggs steamed in volcanic steam vents as the sun rises over Lake Batur." },
      { name: "Sacred Monkey Forest Sanctuary in Ubud", category: "Wildlife", cost: 6, durationMinutes: 90, rating: 4.7, description: "Walk among ancient moss-covered temples and watch hundreds of playful Balinese long-tailed macaques." },
      { name: "Tanah Lot Sea Temple Wave Reflections", category: "Sightseeing", cost: 5, durationMinutes: 90, rating: 4.8, description: "Photograph the iconic offshore pilgrimage rock temple surrounded by ocean tides at twilight." },
      { name: "Jimbaran Bay Candlelight Grilled Seafood Feast", category: "Culinary", cost: 30, durationMinutes: 120, rating: 4.8, description: "Dine directly on the sand with grilled red snapper, jumbo prawns, and squid basted in Balinese spices." },
    ],
  },
];

@Injectable()
export class CitiesSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CitiesSeedService.name);

  constructor(
    @InjectModel(City.name) private cityModel: Model<CityDocument>,
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>
  ) {}

  async onApplicationBootstrap() {
    await this.seed();
  }

  async seed() {
    try {
      this.logger.log("Syncing comprehensive destination and activity catalog into MongoDB...");

      let newCitiesCount = 0;
      let newActivitiesCount = 0;

      for (const cityData of initialCities) {
        const { activities, ...cityProps } = cityData;

        // Check if city exists by name and country
        let city = await this.cityModel.findOne({
          name: cityProps.name,
          country: cityProps.country,
        });

        if (!city) {
          city = await this.cityModel.create(cityProps);
          newCitiesCount++;
        } else {
          // Update details/description/imageUrl if improved
          city.description = cityProps.description;
          city.imageUrl = cityProps.imageUrl;
          city.popularityScore = cityProps.popularityScore;
          city.costIndex = cityProps.costIndex;
          await city.save();
        }

        // Check activities for this city
        if (activities && activities.length > 0) {
          const existingActivitiesCount = await this.activityModel.countDocuments({
            cityId: city._id,
          });

          if (existingActivitiesCount === 0) {
            const activityDocs = activities.map((act) => ({
              ...act,
              cityId: city._id,
            }));
            await this.activityModel.insertMany(activityDocs);
            newActivitiesCount += activityDocs.length;
          }
        }
      }

      const totalCities = await this.cityModel.countDocuments();
      const totalActivities = await this.activityModel.countDocuments();

      this.logger.log(
        `Catalog sync complete. Added ${newCitiesCount} new cities, ${newActivitiesCount} new activities. Total in database: ${totalCities} cities, ${totalActivities} activities.`
      );
    } catch (err) {
      this.logger.error("Failed to sync destination database", err);
    }
  }
}
