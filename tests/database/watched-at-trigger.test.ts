import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260908120000_fix_watched_at_trigger.sql",
);
const verificationPath = path.join(
  process.cwd(),
  "supabase",
  "verification",
  "watched-state.sql",
);

describe("watched timestamp corrective migration", () => {
  it("handles inserts before reading OLD and applies to both title tables", () => {
    const migration = readFileSync(migrationPath, "utf8");
    const functionBody = migration.match(
      /create or replace function public\.set_user_title_watched_at\(\)[\s\S]*?as \$\$([\s\S]*?)\$\$/i,
    )?.[1];

    expect(functionBody).toBeDefined();
    expect(functionBody).toMatch(/if tg_op = 'INSERT' then/i);
    expect(functionBody?.indexOf("old.status")).toBeGreaterThan(
      functionBody?.indexOf("if tg_op = 'INSERT' then") ?? -1,
    );
    expect(migration).toMatch(
      /create trigger user_titles_set_watched_at[\s\S]*?before insert or update on public\.user_titles/i,
    );
    expect(migration).toMatch(
      /create trigger user_seasons_set_watched_at[\s\S]*?before insert or update on public\.user_seasons/i,
    );
  });

  it("has a rollback-safe SQL verification script for insert and update behavior", () => {
    const verification = readFileSync(verificationPath, "utf8");

    expect(verification).toMatch(/begin;[\s\S]*rollback;/i);
    expect(verification).toMatch(/insert into watched_state_trigger_fixture \(status\)[\s\S]*values \('watched'\)/i);
    expect(verification).toMatch(/leaving watched did not clear watched_at/i);
    expect(verification).toMatch(/watched update did not assign watched_at/i);
    expect(verification).toMatch(/user_titles_set_watched_at/i);
    expect(verification).toMatch(/user_seasons_set_watched_at/i);
  });
});
