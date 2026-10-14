import { testDatabaseUrl } from "./test-db.js";

// Point the app at the test database before any module reads config.
process.env.DATABASE_URL = testDatabaseUrl();
process.env.NODE_ENV = "test";
process.env.AUTH_MODE = "dev";
