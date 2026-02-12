import postgres from 'postgres'

let sql: postgres.Sql<Record<string, never>> | null = null

export function getDb() {
  if (!sql) {
    const url = process.env.DATABASE_URL

    if (!url) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    sql = postgres(url, {
      ssl: process.env.DATABASE_SSL as any,
      prepare: false,
      connect_timeout: 10,
      idle_timeout: 20,
      max: 10,
    })
  }

  return sql
}