jest.mock("mongoose", () => ({
  connect: jest.fn(),
}));

const mongoose = require("mongoose");
const connectDB = require("./db");

describe("connectDB", () => {
  const originalEnv = process.env;
  let logSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.DATABASE_URL;
    delete process.env.MONGO_URI;
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    process.env = originalEnv;
  });

  it("throws when both DATABASE_URL and MONGO_URI are missing", async () => {
    await expect(connectDB()).rejects.toThrow(
      "Missing DATABASE_URL or MONGO_URI in environment variables",
    );
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  it("connects using DATABASE_URL and logs host", async () => {
    process.env.DATABASE_URL = "mongodb://127.0.0.1:27017/voluntier";
    mongoose.connect.mockResolvedValue({
      connection: { host: "127.0.0.1" },
    });

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.DATABASE_URL);
    expect(console.log).toHaveBeenCalledWith("MongoDB connected: 127.0.0.1");
  });

  it("falls back to MONGO_URI when DATABASE_URL is not set", async () => {
    process.env.MONGO_URI = "mongodb://localhost:27017/voluntier";
    mongoose.connect.mockResolvedValue({
      connection: { host: "localhost" },
    });

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
  });

  it("rewrites ENOTFOUND errors with a helpful DNS message", async () => {
    process.env.DATABASE_URL = "mongodb://missing-host.example.com:27017/voluntier";
    const enotfoundError = new Error("getaddrinfo ENOTFOUND");
    enotfoundError.code = "ENOTFOUND";
    mongoose.connect.mockRejectedValue(enotfoundError);

    await expect(connectDB()).rejects.toThrow(
      "missing-host.example.com:27017 could not be resolved in DNS.",
    );
  });
});

