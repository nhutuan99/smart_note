export async function getJSON<T>(kv: KVNamespace, key: string): Promise<T | null> {
  return kv.get<T>(key, 'json')
}

export async function putJSON(kv: KVNamespace, key: string, data: unknown): Promise<void> {
  await kv.put(key, JSON.stringify(data))
}
