import test from 'node:test'
import assert from 'node:assert/strict'
import { productInput } from './catalog.js'

const validProduct = {
  name: 'Salmon Cat Food', description: 'A complete everyday recipe for adult cats.',
  categoryId: '507f1f77bcf86cd799439011', species: ['cat'], price: 1200, stock: 8,
}

test('product input applies safe defaults', () => {
  const result = productInput.parse(validProduct)
  assert.equal(result.status, 'DRAFT')
  assert.deepEqual(result.images, [])
})

test('product input rejects a discount greater than the list price', () => {
  const result = productInput.safeParse({ ...validProduct, discountPrice: 1300 })
  assert.equal(result.success, false)
})

test('product input rejects negative stock and malformed category ids', () => {
  assert.equal(productInput.safeParse({ ...validProduct, stock: -1 }).success, false)
  assert.equal(productInput.safeParse({ ...validProduct, categoryId: 'food' }).success, false)
})

test('product input rejects excessive image counts', () => {
  const images = Array.from({ length: 9 }, (_, index) => ({ url: `https://images.example/${index}.jpg` }))
  assert.equal(productInput.safeParse({ ...validProduct, images }).success, false)
})
