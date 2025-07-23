import { insertUserSchema } from "./shared/schema.js";

const testData = {
  name: "Test User",
  email: "test@example.com",
  password: "test123",
  confirmPassword: "test123"
};

try {
  const result = insertUserSchema.parse(testData);
  console.log("Schema validation successful:", result);
} catch (error) {
  console.log("Schema validation failed:", error.errors);
}