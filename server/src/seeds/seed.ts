import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { Category } from '../models/Marketplace.js'
import { User } from '../models/User.js'

const initialCategories = [
  ['Food & Treats', 'food-treats'], ['Toys', 'toys'], ['Grooming', 'grooming'], ['Collars & Leashes', 'collars-leashes'],
  ['Beds', 'beds'], ['Bowls', 'bowls'], ['Litter', 'litter'], ['Health & Wellness', 'health-wellness'],
  ['Clothing', 'clothing'], ['Travel', 'travel'], ['Training', 'training'], ['Accessories', 'accessories'], ['Other', 'other'],
]

async function seed() {
  await mongoose.connect(env.MONGO_URI)
  for (const [index, [name, slug]] of initialCategories.entries()) {
    await Category.updateOne({ slug }, { $setOnInsert: { name, slug, order: index, active: true } }, { upsert: true })
  }
  const email = env.ADMIN_EMAIL
  const password = env.ADMIN_PASSWORD
  if (email && password) {
    await User.updateOne({ role: 'ADMIN' }, { $setOnInsert: { firstName: 'Kitty', lastName: 'Admin', email: email.toLowerCase(), phone: '0000000000', passwordHash: await bcrypt.hash(password, 12), role: 'ADMIN', status: 'ACTIVE' } }, { upsert: true })
    console.info(`Seeded ${initialCategories.length} categories and ensured the configured admin account exists.`)
  } else if (!password) {
    console.info(`Seeded ${initialCategories.length} categories. Admin account skipped; set ADMIN_EMAIL and ADMIN_PASSWORD to seed one.`)
  } else {
    throw new Error('Set both ADMIN_EMAIL and ADMIN_PASSWORD, or leave both unset')
  }
  await mongoose.disconnect()
}

seed().catch(async error => { console.error(error); await mongoose.disconnect(); process.exitCode = 1 })
