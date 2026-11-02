const mocks = vi.hoisted(() => ({
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
    client: vi.fn(),
    embedded: vi.fn(),
    stop: vi.fn(),
}));

vi.mock("pg", () => ({
    Client: function (opts: unknown) {
        mocks.client(opts);
        return {
            connect: mocks.connect,
            query: mocks.query,
            end: mocks.end,
        };
    },
}));

vi.mock("embedded-postgres", () => ({
    default: function () {
        mocks.embedded();
        return {
            initialise: vi.fn(),
            start: vi.fn(),
            createDatabase: vi.fn(),
            stop: mocks.stop,
        };
    },
}));

import setup from "../__integration__/globalSetup";

describe("integration globalSetup", () => {
    const saved = process.env.TEST_DATABASE_URL;

    beforeEach(() => vi.clearAllMocks());
    afterAll(() => {
        if (saved === undefined) delete process.env.TEST_DATABASE_URL;
        else process.env.TEST_DATABASE_URL = saved;
    });

    it("refuses a non-test database before connecting", async () => {
        process.env.TEST_DATABASE_URL = "postgres://u:p@h/prod";
        await expect(setup()).rejects.toThrow();
        expect(mocks.client).not.toHaveBeenCalled();
        expect(mocks.embedded).not.toHaveBeenCalled();
    });

    it("uses embedded Postgres when the URL is empty", async () => {
        process.env.TEST_DATABASE_URL = "";
        const teardown = await setup();
        expect(mocks.embedded).toHaveBeenCalledTimes(1);
        expect(mocks.client).toHaveBeenCalledWith({
            connectionString:
                "postgres://bt_test:bt_test@localhost:54330/budget_test",
        });
        await teardown();
    });
});
