// tests/user.test.js
const User = require("../models/user");

test("should fail if user not found", async () => {
  await expect(
    User.login("fake@email.com", "123456")
  ).rejects.toThrow("Incorrect email or phone");
});

