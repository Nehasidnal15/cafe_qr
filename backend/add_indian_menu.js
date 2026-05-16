require('dotenv').config();
const db = require('./db');
const MenuItem = require('./models/MenuItem');

const newItems = [
  {
    name: "Idli Sambar",
    description: "Soft steamed rice cakes served with lentil soup and coconut chutney.",
    price: 120,
    category: "Indian Breakfast",
    type: "veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Chole Bhature Combo",
    description: "Spicy chickpea curry with fluffy deep-fried bread, served with sweet lassi.",
    price: 250,
    category: "Combos",
    type: "veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "North Indian Thali",
    description: "A complete meal with dal makhani, paneer butter masala, naan, rice, and a sweet.",
    price: 350,
    category: "Meals",
    type: "veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Chicken Chettinad Meal",
    description: "Spicy South Indian chicken curry served with parotta and rice.",
    price: 420,
    category: "Meals",
    type: "non-veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Rasmalai",
    description: "Soft cottage cheese dumplings soaked in sweetened, thickened milk with pistachios.",
    price: 180,
    category: "Dessert",
    type: "veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1589114472382-721db5976b32?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Poori Sabji",
    description: "Puffed deep-fried wheat bread served with a flavorful potato curry.",
    price: 150,
    category: "Indian Breakfast",
    type: "veg",
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=300&h=300"
  }
];

const addItems = async () => {
  try {
    for (const item of newItems) {
      await MenuItem.create(item);
    }
    console.log(`Successfully added ${newItems.length} Indian menu items!`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to add menu items:', err);
    process.exit(1);
  }
};

addItems();
