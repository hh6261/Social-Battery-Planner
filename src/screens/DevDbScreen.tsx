/* eslint-disable i18next/no-literal-string */
// Developer-only screen: its text is deliberately not translated, users never see it.
import React, { useEffect, useState } from 'react';
import { Button, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getDb } from '../db/client';
import { runUnicodeRoundTripTest, SelfTestResult } from '../db/selfTest';

// Whitelist: table names are never taken from user input.
const TABLES = [
  'user_profile',
  'event_type',
  'event',
  'event_reflection',
  'weather_cache',
  'mood',
  'check_in',
  'check_in_mood',
  'journal_entry',
] as const;

type Table = (typeof TABLES)[number];

type Snapshot = {
  rows: Record<string, unknown>[];
  counts: Record<string, number>;
  version: number | null;
};

async function readSnapshot(table: Table): Promise<Snapshot> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table} LIMIT 200`);
  const counts: Record<string, number> = {};
  for (const t of TABLES) {
    const r = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${t}`);
    counts[t] = r?.n ?? 0;
  }
  const v = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return { rows, counts, version: v?.user_version ?? null };
}

/**
 * Developer-only screen. It is only linked from the home screen when __DEV__ is true,
 * and the guard below is a second safety net.
 */
export default function DevDbScreen() {
  const [table, setTable] = useState<Table>('check_in');
  const [snapshot, setSnapshot] = useState<Snapshot>({ rows: [], counts: {}, version: null });
  const [tests, setTests] = useState<SelfTestResult[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Reload whenever the table changes or the user taps Refresh.
  useEffect(() => {
    let cancelled = false;
    readSnapshot(table)
      .then((s) => {
        if (!cancelled) setSnapshot(s);
      })
      .catch((e) => console.error('DB viewer failed', e));
    return () => {
      cancelled = true;
    };
  }, [table, reloadKey]);

  const refresh = () => setReloadKey((n) => n + 1);

  if (!__DEV__) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dev DB viewer (user_version: {snapshot.version ?? '?'})</Text>

      <View style={styles.tabs}>
        {TABLES.map((t) => (
          <View key={t} style={styles.tab}>
            <Button
              title={`${t} (${snapshot.counts[t] ?? 0})${t === table ? ' •' : ''}`}
              onPress={() => setTable(t)}
            />
          </View>
        ))}
      </View>

      <Button title="Refresh" onPress={refresh} />
      <Button
        title="Run unicode round-trip test"
        onPress={async () => {
          setTests(await runUnicodeRoundTripTest());
          refresh();
        }}
      />
      {tests?.map((t) => (
        <Text key={t.name} style={{ color: t.ok ? 'green' : 'red' }}>
          {t.ok ? 'PASS' : 'FAIL'} – {t.name} {t.detail ?? ''}
        </Text>
      ))}

      <Text style={styles.heading}>{table}</Text>
      {snapshot.rows.length === 0 && <Text>(no rows)</Text>}
      {snapshot.rows.map((r, i) => (
        <Text key={i} style={styles.row} selectable>
          {JSON.stringify(r)}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 48 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  heading: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 6 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  tab: { marginRight: 4, marginBottom: 4 },
  row: { fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }), fontSize: 11, marginBottom: 6 },
});