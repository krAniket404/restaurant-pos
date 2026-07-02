import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAyZYtMc3aCa72YxTWSKmAT4k_rDHdY2ns",
  authDomain: "restaurant-pos-20c52.firebaseapp.com",
  projectId: "restaurant-pos-20c52",
  storageBucket: "restaurant-pos-20c52.firebasestorage.app",
  messagingSenderId: "617717714208",
  appId: "1:617717714208:web:7ef683838f502c24c35b45"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  console.log("Fetching Sanity data...");
  const query = encodeURIComponent('*[_type in ["menuItem", "category", "restaurant", "user"]]{_id, _type, title, price, isVeg, isAvailable, description, slug, tables, name, username, password, role, category->{_id, title}}');
  const sanityUrl = `https://p8g8vsyn.api.sanity.io/v2023-05-03/data/query/production?query=${query}`;
  
  const res = await fetch(sanityUrl);
  const json = await res.json();
  const docs = json.result;

  const categories = docs.filter(d => d._type === 'category');
  const menuItems = docs.filter(d => d._type === 'menuItem');
  const users = docs.filter(d => d._type === 'user');
  const restaurant = docs.find(d => d._type === 'restaurant');

  console.log(`Found: ${categories.length} categories, ${menuItems.length} menu items, ${users.length} users.`);

  // Map Sanity IDs to Firestore IDs for categories
  const categoryRefMap = new Map();

  console.log("Migrating categories...");
  for (const cat of categories) {
    const docRef = await addDoc(collection(db, 'categories'), {
      name: cat.title,
      slug: cat.slug?.current || cat.title.toLowerCase().replace(/\s+/g, '-')
    });
    categoryRefMap.set(cat._id, docRef.id);
  }

  console.log("Migrating menu items...");
  for (const item of menuItems) {
    await addDoc(collection(db, 'menuItems'), {
      name: item.title,
      price: item.price,
      dietType: item.isVeg ? 'veg' : 'non-veg',
      isAvailable: item.isAvailable,
      description: item.description || '',
      categoryId: item.category?._id ? categoryRefMap.get(item.category._id) : null
    });
  }

  console.log("Migrating users...");
  // Manual hashing algorithm (simple SHA-256 using subtle crypto for demo purposes, 
  // but Node's crypto is easier here. Let's use Node crypto)
  const crypto = await import('crypto');
  
  for (const user of users) {
    const hashedPassword = crypto.createHash('sha256').update(user.password || 'password').digest('hex');
    await addDoc(collection(db, 'users'), {
      username: user.username,
      password: hashedPassword,
      role: user.role
    });
  }

  console.log("Migrating settings...");
  if (restaurant) {
    await setDoc(doc(db, 'settings', 'general'), {
      numberOfTables: restaurant.tables || 0,
      name: 'Geethika Restaurant'
    });
  } else {
    await setDoc(doc(db, 'settings', 'general'), {
      numberOfTables: 20,
      name: 'Geethika Restaurant'
    });
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(console.error);
