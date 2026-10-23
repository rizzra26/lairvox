#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/332859e85b4e76d2897d93e1d472f52304064bf4480b7d93dd0c1edf18c7e95c/contract';
import startContract from '../../snapshots/332859e85b4e76d2897d93e1d472f52304064bf4480b7d93dd0c1edf18c7e95c/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/6e2cd08108adbd1f13f5760f8f052935a3e144c8cd6cc97224e77126bdd33c78/contract';
import endContract from '../../snapshots/6e2cd08108adbd1f13f5760f8f052935a3e144c8cd6cc97224e77126bdd33c78/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.setDefault({
        schema: 'public',
        table: 'DirectMessage',
        column: col('updatedAt', 'timestamptz', {
          default: fn(sql`now()`),
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.setDefault({
        schema: 'public',
        table: 'Message',
        column: col('updatedAt', 'timestamptz', {
          default: fn(sql`now()`),
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
