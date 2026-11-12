import React, { useCallback, useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
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

/**
 * Developer-only screen. Register it as a route/screen only when __DEV__ is true, e.g.
 *   {__DEV__ && <Stack.Screen name="DevDb" component={DevDbScreen} />}
 * (the guard below is a second safety net).
 */
export default function DevDbScreen() {
  const [table, setTable] = useState<Table>('check_in');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [version, setVersion] = useState<number | null>(null);
  const [tests, setTests] = useState<SelfTestResult[] | null>(null);

  const load = useCallback(async () => {
    const db = await getDb();
    setRows(await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table} LIMIT 200`));
    const c: Record<string, number> = {};
    for (const t of TABLES) {
      const r = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${t}`);
      c[t] = r?.n ?? 0;
    }
    setCounts(c);
    const v = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    setVersion(v?.user_version ?? null);
  }, [table]);

  useEffect(() => {
    load();
  }, [load]);

  if (!__DEV__) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dev DB viewer (user_version: {version ?? '?'})</Text>

      <View style={styles.tabs}>
        {TABLES.map((t) => (
          <View key={t} style={styles.tab}>
            <Button title={`${t} (${counts[t] ?? 0})${t === table ? ' •' : ''}`} onPress={() => setTable(t)} />
          </View>
        ))}
      </View>

      <Button title="Refresh" onPress={load} />
      <Button
        title="Run unicode round-trip test"
        onPress={async () => {
          setTests(await runUnicodeRoundTripTest());
          load();
        }}
      />
      {tests?.map((t) => (
        <Text key={t.name} style={{ color: t.ok ? 'green' : 'red' }}>
          {t.ok ? 'PASS' : 'FAIL'} – {t.name} {t.detail ?? ''}
        </Text>
      ))}

      <Text style={styles.heading}>{table}</Text>
      {rows.length === 0 && <Text>(no rows)</Text>}
      {rows.map((r, i) => (
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
  row: { fontFamily: 'Courier', fontSize: 11, marginBottom: 6 },
});
