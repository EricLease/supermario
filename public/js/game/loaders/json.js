export async function loadJSON(url) {
    const r = await fetch(url);
    return await r.json();
}