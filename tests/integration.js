// tests/auth.test.js
const request = require("supertest");
const app = require("../app"); // your express app

describe("Auth API", () => {
  it("should login user", async () => {
    const res = await request(app)
      .post("/login")
      .send({
        identifier: "admin@mail.com",
        password: "12345678"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });
});