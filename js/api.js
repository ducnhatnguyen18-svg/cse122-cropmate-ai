/* =========================================================
   CropMate AI — Data access layer (mock / LocalStorage)
   Không hardcode dữ liệu rải rác: mọi trang đọc qua api.js
   ========================================================= */
(function (global) {
  const STORAGE_KEY = "cropmate_data_v1";
  const DATA_FILES = {
    farms: "../assets/data/farms.json",
    fields: "../assets/data/fields.json",
    seasons: "../assets/data/seasons.json",
    fieldLogs: "../assets/data/field-logs.json",
    helpRequests: "../assets/data/help-requests.json",
    resources: "../assets/data/resources.json",
  };

  // Load seed JSON once, then persist edits in LocalStorage.
  async function seed() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);

    const data = {};
    for (const [entity, path] of Object.entries(DATA_FILES)) {
      try {
        const res = await fetch(path);
        data[entity] = res.ok ? await res.json() : [];
      } catch {
        data[entity] = [];
      }
    }
    persist(data);
    return data;
  }

  function persist(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  async function getAll(entity) {
    const data = await seed();
    return data[entity] || [];
  }

  async function getById(entity, id) {
    const rows = await getAll(entity);
    return rows.find((r) => String(r.id) === String(id)) || null;
  }

  async function create(entity, record) {
    const data = await seed();
    const rows = data[entity] || [];
    const nextId = rows.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;
    const row = { id: nextId, ...record };
    rows.push(row);
    data[entity] = rows;
    persist(data);
    return row;
  }

  async function update(entity, id, patch) {
    const data = await seed();
    const rows = data[entity] || [];
    const idx = rows.findIndex((r) => String(r.id) === String(id));
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch };
    data[entity] = rows;
    persist(data);
    return rows[idx];
  }

  // Business entities prefer archive over hard delete.
  async function archive(entity, id) {
    return update(entity, id, { archived: true });
  }

  async function remove(entity, id) {
    const data = await seed();
    data[entity] = (data[entity] || []).filter((r) => String(r.id) !== String(id));
    persist(data);
    return true;
  }

  async function reset() {
    localStorage.removeItem(STORAGE_KEY);
    return seed();
  }

  global.API = { seed, getAll, getById, create, update, archive, remove, reset };
})(window);
