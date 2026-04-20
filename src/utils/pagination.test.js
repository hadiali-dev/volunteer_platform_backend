const pagination = require("./pagination");

describe("pagination utility", () => {
  it("returns defaults when query params are missing", () => {
    const req = { query: {} };

    expect(pagination(req)).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
    });
  });

  it("parses valid page and limit values", () => {
    const req = { query: { page: "3", limit: "25" } };

    expect(pagination(req)).toEqual({
      page: 3,
      limit: 25,
      skip: 50,
    });
  });

  it("clamps page to minimum 1", () => {
    const req = { query: { page: "0", limit: "10" } };

    expect(pagination(req)).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
    });
  });

  it("caps limit at 100", () => {
    const req = { query: { page: "2", limit: "500" } };

    expect(pagination(req)).toEqual({
      page: 2,
      limit: 100,
      skip: 100,
    });
  });
});
