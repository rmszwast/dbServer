import { createPool } from "mysql";

// Create a 'connection pool' using the provided credentials
export const pool = createPool({
    connectionLimit : 10,
    host            : "classmysql.engr.oregonstate.edu",
    user            : "foo", 
    password        : "secret",
    database        : "mydb",
});

