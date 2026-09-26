export type Product = { id: string; name: string; brand: string; price: number; oldPrice?: number; rating: number; reviews: number; category: string; kind: 'cat' | 'dog' | 'both'; image: string; badge?: string; seller: string }

export const products: Product[] = [
  { id: 'p1', name: 'Wild Coast Salmon Recipe', brand: 'Pawfect Pantry', price: 1890, oldPrice: 2250, rating: 4.9, reviews: 128, category: 'Food', kind: 'cat', image: 'photo-1589924691995-400dc9ecc119', badge: 'Bestseller', seller: 'Paws & Whiskers' },
  { id: 'p2', name: 'Cloud Nine Plush Bed', brand: 'Mellow Pets', price: 2450, rating: 4.8, reviews: 84, category: 'Beds', kind: 'both', image: 'photo-1541599540903-216a46ca1dc0', badge: 'Loved by pets', seller: 'Good Boy Goods' },
  { id: 'p3', name: 'Tuna & Pumpkin Bites', brand: 'Little Lion', price: 680, oldPrice: 820, rating: 4.9, reviews: 203, category: 'Treats', kind: 'cat', image: 'photo-1601758228041-f3b2795255f1', badge: 'Save 17%', seller: 'Paws & Whiskers' },
  { id: 'p4', name: 'Everyday Walk Set', brand: 'Roam & Wag', price: 1350, rating: 4.7, reviews: 61, category: 'Walking', kind: 'dog', image: 'photo-1551717743-49959800b1f6', seller: 'Good Boy Goods' },
  { id: 'p5', name: 'Calm Coat Grooming Kit', brand: 'Soft Sunday', price: 1120, rating: 4.8, reviews: 42, category: 'Grooming', kind: 'both', image: 'photo-1516734212186-a967f81ad0d7', seller: 'The Gentle Paw' },
  { id: 'p6', name: 'Little Explorer Toy Set', brand: 'Happy Tails', price: 950, oldPrice: 1200, rating: 4.6, reviews: 76, category: 'Toys', kind: 'both', image: 'photo-1535294435445-d7249524ef2e', badge: 'Sale', seller: 'The Gentle Paw' },
  { id: 'p7', name: 'Garden Fresh Chicken Kibble', brand: 'Bowl & Bloom', price: 2290, rating: 4.9, reviews: 98, category: 'Food', kind: 'dog', image: 'photo-1568640347023-a616a30bc3bd', seller: 'Paws & Whiskers' },
  { id: 'p8', name: 'Ceramic Slow Feeder', brand: 'Pawfect Pantry', price: 890, rating: 4.7, reviews: 53, category: 'Bowls', kind: 'both', image: 'photo-1582798358481-d199fb7347bb', seller: 'Moss & Muzzle' },
]

export const categories = [
  { name: 'Food & treats', key: 'Food', emoji: '🥣', tint: 'peach' },
  { name: 'Toys & play', key: 'Toys', emoji: '🧶', tint: 'lavender' },
  { name: 'Beds & comfort', key: 'Beds', emoji: '🛏️', tint: 'mint' },
  { name: 'Walk & explore', key: 'Walking', emoji: '🦮', tint: 'butter' },
  { name: 'Grooming', key: 'Grooming', emoji: '🫧', tint: 'blue' },
]

export const imageUrl = (id: string, width = 640) => id.startsWith('http') ? id : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`
