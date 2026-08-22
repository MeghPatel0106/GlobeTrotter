import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { City, CityDocument } from "../schemas/city.schema";
import { Activity, ActivityDocument } from "../schemas/activity.schema";

const initialCities = [
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
      const count = await this.cityModel.countDocuments();
      if (count > 0) {
        this.logger.log(`Cities collection already contains ${count} records. Seed skipped.`);
        return;
      }

      this.logger.log("Seeding initial Atlas & Ink destinations and activities into MongoDB...");

      for (const cityData of initialCities) {
        const { activities, ...cityProps } = cityData;
        const city = await this.cityModel.create(cityProps);

        if (activities && activities.length > 0) {
          const activityDocs = activities.map((act) => ({
            ...act,
            cityId: city._id,
          }));
          await this.activityModel.insertMany(activityDocs);
        }
      }

      this.logger.log(`Successfully seeded ${initialCities.length} destinations with activities.`);
    } catch (err) {
      this.logger.error("Failed to seed initial cities", err);
    }
  }
}
