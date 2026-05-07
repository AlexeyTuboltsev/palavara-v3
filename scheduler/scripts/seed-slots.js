#!/usr/bin/env node
/**
 * One-time migration: seed the existing May 2026 slots into the new
 * `palavara-slots` DynamoDB table.
 *
 * Idempotent — checks for an active row on each (date, start) pair and
 * skips creation if one already exists. Safe to re-run.
 *
 * Usage:
 *   docker compose run --rm aws node scripts/seed-slots.js
 *
 * (or any environment with AWS creds + the SDK installed)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const TABLE = process.env.SLOTS_TABLE || 'palavara-slots';
const REGION = process.env.AWS_REGION || 'eu-central-1';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

// The 16 dates × slots that were previously hardcoded in slots.js.
const SEED = {
  '2026-05-07': [['14:00', '16:00'], ['16:30', '18:30'], ['19:00', '21:00']],
  '2026-05-09': [['15:00', '17:00']],
  '2026-05-11': [['14:00', '16:00'], ['16:30', '18:30'], ['19:00', '21:00']],
  '2026-05-12': [['14:00', '16:00'], ['16:30', '18:30'], ['19:00', '21:00']],
  '2026-05-13': [['18:30', '20:30']],
  '2026-05-14': [['14:00', '16:00'], ['16:30', '18:30'], ['19:00', '21:00']],
  '2026-05-16': [['15:00', '17:00']],
  '2026-05-18': [['14:00', '16:00'], ['16:30', '18:30'], ['19:00', '21:00']],
  '2026-05-19': [['14:00', '16:00'], ['16:30', '18:30'], ['19:00', '21:00']],
  '2026-05-20': [['18:30', '20:30']],
  '2026-05-21': [['14:00', '16:00'], ['16:30', '18:30'], ['19:00', '21:00']],
  '2026-05-25': [['14:00', '16:00'], ['16:30', '18:30'], ['19:00', '21:00']],
  '2026-05-26': [['14:00', '16:00'], ['16:30', '18:30'], ['19:00', '21:00']],
  '2026-05-27': [['18:30', '20:30']],
  '2026-05-28': [['14:00', '16:00'], ['16:30', '18:30'], ['19:00', '21:00']],
  '2026-05-30': [['15:00', '17:00']],
};


async function exists(date, start) {
  const result = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'date-index',
    KeyConditionExpression: '#d = :date AND #st = :start',
    FilterExpression: '#s = :active',
    ExpressionAttributeNames: { '#d': 'date', '#st': 'start', '#s': 'status' },
    ExpressionAttributeValues: { ':date': date, ':start': start, ':active': 'active' },
    Limit: 1,
  }));
  return (result.Items || []).length > 0;
}


async function run() {
  const now = new Date().toISOString();
  const toCreate = [];
  let skipped = 0;

  for (const [date, slots] of Object.entries(SEED)) {
    for (const [start, end] of slots) {
      if (await exists(date, start)) {
        skipped += 1;
        continue;
      }
      const slotId = crypto.randomUUID();
      toCreate.push({
        PK:        `SLOT#${slotId}`,
        slotId,
        date,
        start,
        end,
        status:    'active',
        createdAt: now,
      });
    }
  }

  for (let i = 0; i < toCreate.length; i += 25) {
    const chunk = toCreate.slice(i, i + 25);
    await ddb.send(new BatchWriteCommand({
      RequestItems: {
        [TABLE]: chunk.map((Item) => ({ PutRequest: { Item } })),
      },
    }));
  }

  console.log(`Seeded ${toCreate.length} slots. Skipped ${skipped} that already existed.`);
}

run().catch((err) => {
  console.error('seed-slots failed:', err);
  process.exit(1);
});
