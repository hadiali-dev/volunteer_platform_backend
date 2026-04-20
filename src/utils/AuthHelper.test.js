const jwt = require("jsonwebtoken");

const AuthHelper = require("./AuthHelper");

describe("AuthHelper.signToken", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, JWT_SECRET: "test-secret-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("creates a JWT containing the user id", () => {
    const token = AuthHelper.signToken("user-123");
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    expect(payload.id).toBe("user-123");
  });

  it("creates a token that expires in 7 days", () => {
    const token = AuthHelper.signToken("user-456");
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    expect(payload.exp - payload.iat).toBe(7 * 24 * 60 * 60);
  });

  it("throws when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;

    expect(() => AuthHelper.signToken("user-789")).toThrow();
  });
});

