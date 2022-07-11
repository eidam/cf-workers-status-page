export class Database {
    binding;
    constructor(binding) {
        this.binding = binding;
    }
    prepare(query) {
        return new PreparedStatement(this, query);
    }
    async dump() {
        const response = await this.binding.fetch("/dump", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
        });
        if (response.status !== 200) {
            const err = (await response.json());
            throw new Error("D1_DUMP_ERROR", {
                cause: new Error(err.error),
            });
        }
        return await response.arrayBuffer();
    }
    async batch(statements) {
        const exec = await this._send("/query", statements.map((s) => s.statement), statements.map((s) => s.params));
        return exec;
    }
    async exec(query) {
        const lines = query.trim().split("\n");
        const exec = await this._send("/query", lines, []);
        const error = exec
            .map((r) => {
            return r.error ? 1 : 0;
        })
            .indexOf(1);
        if (error !== -1) {
            throw new Error("D1_EXEC_ERROR", {
                cause: new Error(`Error in line ${error + 1}: ${lines[error]}: ${exec[error].error}`),
            });
        }
        else {
            return {
                count: exec.length,
                duration: exec.reduce((p, c) => {
                    return p.duration + c.duration;
                }),
            };
        }
    }
    async _send(endpoint, query, params) {
        const body = JSON.stringify(typeof query == "object"
            ? query.map((s, index) => {
                return { sql: s, params: params[index] };
            })
            : {
                sql: query,
                params: params,
            });
        const response = await this.binding.fetch(endpoint, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body,
        });
        if (response.status !== 200) {
            const err = (await response.json());
            throw new Error("D1_ERROR", { cause: new Error(err.error) });
        }
        const answer = await response.json();
        return Array.isArray(answer) ? answer : answer;
    }
}
class PreparedStatement {
    statement;
    database;
    params;
    constructor(database, statement, values) {
        this.database = database;
        this.statement = statement;
        this.params = values || [];
    }
    bind(...values) {
        return new PreparedStatement(this.database, this.statement, values);
    }
    async first(colName) {
        const info = await this.database._send("/query", this.statement, this.params);
        const results = info.results;
        if (results.length < 1) {
            throw new Error("D1_NORESULTS", { cause: new Error("No results") });
        }
        const result = results[0];
        if (colName !== undefined) {
            if (result[colName] === undefined) {
                throw new Error("D1_COLUMN_NOTFOUND", {
                    cause: new Error(`Column not found`),
                });
            }
            return result[colName];
        }
        else {
            return result;
        }
    }
    async run() {
        return this.database._send("/execute", this.statement, this.params);
    }
    async all() {
        return await this.database._send("/query", this.statement, this.params);
    }
    async raw() {
        const s = await this.database._send("/query", this.statement, this.params);
        const raw = [];
        for (var r in s.results) {
            const entry = Object.keys(s.results[r]).map((k) => {
                return s.results[r][k];
            });
            raw.push(entry);
        }
        return raw;
    }
}
