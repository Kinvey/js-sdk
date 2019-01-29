export async function clear() {
  const { appKey } = getConfig();
  await _clear(appKey);
  return null;
}
