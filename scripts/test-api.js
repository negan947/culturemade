#!/usr/bin/env node

/**
 * API Testing Script for CultureMade iPhone App
 * 
 * Tests all implemented API endpoints to ensure they're working correctly
 * Run with: node scripts/test-api.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing ${name}...`)
  console.log(`   URL: ${url}`)
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log(`   ✅ Status: ${response.status}`)
      console.log(`   ✅ Success: ${data.success}`)
      
      if (data.data) {
        if (Array.isArray(data.data)) {
          console.log(`   📊 Data: Array with ${data.data.length} items`)
        } else {
          console.log(`   📊 Data: Object with keys: ${Object.keys(data.data).join(', ')}`)
        }
      }
      
      if (data.meta) {
        console.log(`   📋 Meta: ${JSON.stringify(data.meta)}`)
      }
      
      return { success: true, data, response }
    } else {
      console.log(`   ❌ Status: ${response.status}`)
      console.log(`   ❌ Error: ${data.error?.message || 'Unknown error'}`)
      return { success: false, data, response }
    }
  } catch (error) {
    console.log(`   💥 Network Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🚀 Starting CultureMade API Tests')
  console.log(`📍 Base URL: ${BASE_URL}`)
  
  const results = []
  
  // Test 1: Get Products (basic)
  results.push(await testEndpoint(
    'Get Products (basic)',
    `${BASE_URL}/api/products`
  ))
  
  // Test 2: Get Products with filters
  results.push(await testEndpoint(
    'Get Products (with filters)',
    `${BASE_URL}/api/products?featured=true&limit=5&sortBy=price_asc`
  ))
  
  // Test 3: Get Categories
  results.push(await testEndpoint(
    'Get Categories',
    `${BASE_URL}/api/categories`
  ))
  
  // Test 4: Get Categories (flat)
  results.push(await testEndpoint(
    'Get Categories (flat)',
    `${BASE_URL}/api/categories?flat=true`
  ))
  
  // Test 5: Search Products
  results.push(await testEndpoint(
    'Search Products',
    `${BASE_URL}/api/search?q=shirt&limit=3`
  ))
  
  // Test 6: Get Cart (empty)
  results.push(await testEndpoint(
    'Get Cart (empty)',
    `${BASE_URL}/api/cart`
  ))
  
  // Test 7: Add to Cart (should fail without valid product)
  results.push(await testEndpoint(
    'Add to Cart (invalid product)',
    `${BASE_URL}/api/cart/add`,
    {
      method: 'POST',
      body: JSON.stringify({
        productId: '00000000-0000-0000-0000-000000000000',
        quantity: 1
      })
    }
  ))
  
  // Test 8: Update Cart Item (should fail without valid item)
  results.push(await testEndpoint(
    'Update Cart Item (invalid item)',
    `${BASE_URL}/api/cart/update`,
    {
      method: 'PUT',
      body: JSON.stringify({
        cartItemId: '00000000-0000-0000-0000-000000000000',
        quantity: 2
      })
    }
  ))
  
  // Test 9: Remove Cart Item (should succeed with soft error)
  results.push(await testEndpoint(
    'Remove Cart Item (invalid item)',
    `${BASE_URL}/api/cart/remove`,
    {
      method: 'DELETE',
      body: JSON.stringify({
        cartItemId: '00000000-0000-0000-0000-000000000000'
      })
    }
  ))
  
  // Test 10: Get Product Detail (should fail with invalid ID)
  results.push(await testEndpoint(
    'Get Product Detail (invalid ID)',
    `${BASE_URL}/api/products/00000000-0000-0000-0000-000000000000`
  ))
  
  // Summary
  console.log('\n📊 Test Summary')
  console.log('================')
  
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${Math.round((passed / results.length) * 100)}%`)
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed, but this may be expected for endpoints that require valid data.')
    console.log('   The important thing is that the endpoints are responding with proper error messages.')
  }
  
  console.log('\n🎉 API testing complete!')
  
  // Return exit code
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Test runner error:', error)
    process.exit(1)
  })
}

module.exports = { testEndpoint, runTests } 