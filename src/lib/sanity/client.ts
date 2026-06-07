import { createClient } from 'next-sanity';

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
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
    description,
    "imageUrl": image.asset->url,
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
  return client.fetch(`*[_type == "table"] | order(tableNumber asc) {
    _id,
    tableNumber,
    capacity
  }`);
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
