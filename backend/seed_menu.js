require('dotenv').config();
const db = require('./db');
const MenuItem = require('./models/MenuItem');

const seedItems = [
  {
    name: "Classic Espresso",
    description: "Rich, full-bodied espresso with a creamy layer of crema.",
    price: 150,
    category: "Coffee",
    type: "veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Iced Caramel Macchiato",
    description: "A refreshing blend of espresso, vanilla syrup, and cold milk.",
    price: 320,
    category: "Coffee",
    type: "veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Matcha Latte",
    description: "Premium grade matcha green tea whisked with steamed oat milk.",
    price: 380,
    category: "Tea",
    type: "veg",
    isAvailable: false,
    imageUrl: "https://images.unsplash.com/photo-1515823662972-da6a29115ecf?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Avocado Toast",
    description: "Smashed avocado on artisan sourdough topped with cherry tomatoes.",
    price: 450,
    category: "Breakfast",
    type: "veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Blueberry Muffin",
    description: "Freshly baked daily, loaded with juicy blueberries.",
    price: 280,
    category: "Pastries",
    type: "veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Grilled Chicken Panini",
    description: "Tender grilled chicken breast, fresh spinach, and mozzarella.",
    price: 550,
    category: "Sandwiches",
    type: "non-veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Margherita Pizza",
    description: "Classic wood-fired pizza with fresh tomato sauce, mozzarella, and basil.",
    price: 650,
    category: "Pizza",
    type: "veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Penne Alfredo Pasta",
    description: "Creamy garlic alfredo sauce tossed with penne pasta and parmesan.",
    price: 580,
    category: "Pasta",
    type: "veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Burger & Fries Combo",
    description: "Classic smash burger with a generous side of crispy seasoned fries.",
    price: 750,
    category: "Combos",
    type: "non-veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1594212848238-7bb7ce1ec7ce?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Paneer Tikka",
    description: "Grilled cottage cheese cubes marinated in spicy yogurt and herbs.",
    price: 350,
    category: "Indian Starters",
    type: "veg",
    isAvailable: true,
    imageUrl: "/indian_paneer_tikka_1777052948856.png"
  },
  {
    name: "Butter Chicken",
    description: "Tender chicken cooked in a rich, creamy tomato gravy with butter.",
    price: 480,
    category: "Indian Mains",
    type: "non-veg",
    isAvailable: true,
    imageUrl: "/indian_butter_chicken_1777053148452.png"
  },
  {
    name: "Chicken Biryani",
    description: "Aromatic basmati rice cooked with succulent chicken and spices.",
    price: 520,
    category: "Indian Mains",
    type: "non-veg",
    isAvailable: true,
    imageUrl: "/indian_chicken_biryani_1777053179822.png"
  },
  {
    name: "Masala Dosa",
    description: "Crispy rice crepe filled with spiced potato mash, served with chutneys.",
    price: 220,
    category: "Indian Breakfast",
    type: "veg",
    isAvailable: true,
    imageUrl: "/indian_masala_dosa_plate_1777053706827.png"
  },
  {
    name: "Gulab Jamun",
    description: "Deep-fried milk dumplings soaked in cardamom flavored sugar syrup.",
    price: 150,
    category: "Dessert",
    type: "veg",
    isAvailable: true,
    imageUrl: "/indian_gulab_jamun_dessert_1777053734073.png"
  },
  {
    name: "Veg Steam Momos",
    description: "Traditional Himalayan dumplings stuffed with seasoned minced vegetables.",
    price: 180,
    category: "Appetizers",
    type: "veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Fish & Chips",
    description: "Crispy battered fish fillets served with steak-cut fries and tartar sauce.",
    price: 620,
    category: "Mains",
    type: "non-veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1579208575657-c595a05383b7?auto=format&fit=crop&q=80&w=300&h=300"
  }
];

const seed = async () => {
  try {
    console.log('Connected to PostgreSQL. Seeding menu items...');
    
    // Clear existing
    await db.query('DELETE FROM menu_items');
    console.log('Cleared existing menu items.');
    
    for (const item of seedItems) {
      await MenuItem.create(item);
    }
    
    console.log(`Successfully seeded ${seedItems.length} menu items!`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed menu items:', err);
    process.exit(1);
  }
};

seed();
