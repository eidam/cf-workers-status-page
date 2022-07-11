/* npx wrangler@d1 d1 execute <database-name> --file=./schema.sql */

CREATE TABLE IF NOT EXISTS monitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    operational INTEGER DEFAULT 0,
    description TEXT DEFAULT NULL,
    method TEXT DEFAULT "GET",
    expect_status INTEGER DEFAULT 200,
    follow_redirect INTEGER DEFAULT 1,
    linkable INTEGER DEFAULT 0,
    operational INTEGER DEFAULT 0,
    last_updated TEXT DEFAULT CURRENT_TIMESTAMP
);

/*
INSERT INTO monitors (name, url) 
    VALUES 
        ("workers.cloudflare.com", "https://www.cloudflare.com"),
        ("www.cloudflare.com", "https://www.cloudflare.com"),
        ("The Cloudflare Blog", "https://blog.cloudflare.com"),
        ("Cloudflare community", "https://cloudflare.community");
*/

CREATE TABLE IF NOT EXISTS monitors_checks (
    monitor_id INTEGER NOT NULL,
    location TEXT NOT NULL,
    res_ms INT NOT NULL,
    operational INTEGER NOT NULL,
    date TEXT DEFAULT CURRENT_DATE,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_monitors
        FOREIGN KEY (monitor_id)
        REFERENCES monitors(id)
        ON DELETE CASCADE
);
