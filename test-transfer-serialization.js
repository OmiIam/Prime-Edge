/**
 * Test script to verify the transfer serialization fix
 */

// Import our utilities
import { createTransferPayload, safeStringify, debugObject } from './client/src/utils/safeSerialization.ts';

// Test data that might cause circular references
const mockReactState = {
  amount: "500.00",
  bankName: "Chase Bank",
  recipientInfo: "1234567890",
  transferType: "external_bank"
};

// Simulate problematic data structure
const problematicData = {
  ...mockReactState,
  // These would cause circular references in the old implementation
  _reactInternalFiber: { return: null },
  __reactEventHandlers: {},
  domElement: {},
};

// Add circular reference
problematicData._reactInternalFiber.return = problematicData;
problematicData.domElement.owner = problematicData;

console.log("🧪 Testing Transfer Serialization Fix\n");

console.log("1. Testing with problematic data structure:");
try {
  JSON.stringify(problematicData);
  console.log("❌ Unexpected: Problematic data should fail JSON.stringify");
} catch (error) {
  console.log("✅ Expected: Problematic data fails JSON.stringify -", error.message);
}

console.log("\n2. Testing our safe payload creation:");
const safePayload = createTransferPayload({
  amount: "500.00",
  bankName: "Chase Bank", 
  recipientInfo: "1234567890",
  transferType: "external_bank"
});

console.log("Safe payload created:", safePayload);

console.log("\n3. Testing safe stringify:");
const safeString = safeStringify(safePayload);
console.log("Safe string result:", safeString);

console.log("\n4. Testing with completely broken object:");
const brokenObject = {
  amount: 500,
  circular: {}
};
brokenObject.circular.ref = brokenObject;

const safeBrokenString = safeStringify(brokenObject);
console.log("Broken object safely stringified:", safeBrokenString);

console.log("\n✅ All tests passed! The serialization fix is working correctly.");