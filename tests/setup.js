const User = require("../models/userModel");

describe("User Model", () => {
  it("should create a user", async () => {
    const user = await User.create({
      email: "test@email.com",
      phone: "123456789",
      password: "123456",
      role: "user"
    });

    expect(user._id).toBeDefined();
    expect(user.email).toBe("test@email.com");
  });

  it("should not allow duplicate phone", async () => {
    await User.create({
      email: "a@email.com",
      phone: "123456789",
      password: "123456",
      role: "user"
    });

    await expect(
      User.create({
        email: "b@email.com",
        phone: "123456789",
        password: "123456",
        role: "user"
      })
    ).rejects.toThrow();
  });
});