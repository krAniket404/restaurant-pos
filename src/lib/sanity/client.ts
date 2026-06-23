import { createClient } from 'next-sanity';

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2023-05-03',
  useCdn: false, // Set to false to ensure fresh data always
});

export const fetchMenuItems = async () => {
  return client.fetch(`*[_type == "menuItem"]{
    _id,
    title,
    price,
    isVeg,
    isAvailable,
    description,
    category->{_id, title}
  }`);
};

export const fetchCategories = async () => {
  return client.fetch(`*[_type == "category"]{
    _id,
    title,
    "slug": slug.current
  }`);
};

export const fetchTables = async () => {
  const restaurant = await client.fetch(`*[_type == "restaurant"][0]{tables}`);
  const numberOfTables: number = restaurant?.tables || 0;
  return Array.from({ length: numberOfTables }, (_, i) => ({
    _id: `table-${i + 1}`,
    tableNumber: i + 1,
  }));
};

export const fetchUsers = async () => {
  return client.fetch(`*[_type == "user"]{
    _id,
    role,
    username,
    password
  }`);
};

export const fetchRestaurantDetails = async () => {
  return client.fetch(`*[_type == "restaurant"][0]{
    name
  }`);
};
