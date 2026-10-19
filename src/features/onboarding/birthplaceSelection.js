import { createPlaceListCache } from "./placeListCache.js";
// Transient selection state only. Every completion is scoped to its generation
// and resource ticket; late responses cannot revive a cleared or changed path.
const resource = () => ({
  status: "IDLE",
  options: [],
  offset: 0,
  total: 0,
  next_offset: null,
  previous_offset: null,
  limited: false,
  level: null,
  error: null,
});
export function createBirthplacePicker({
  request,
  onChange = (_value) => {},
  selection = null,
}) {
  let state = {
    language: "en",
    country: null,
    path: [],
    countries: resource(),
    regions: [],
    places: resource(),
    selection,
    incomplete: false,
    editing: !selection,
  };
  const cache = createPlaceListCache();
  let active = false,
    generation = 0;
  const tickets = new Map(),
    listeners = new Set();
  const emit = (patch) => {
    if (!active) return;
    state = { ...state, ...patch };
    listeners.forEach((fn) => fn());
  };
  const changed = (patch) => {
    emit(patch);
    if (active)
      onChange({ selection: state.selection, incomplete: state.incomplete });
  };
  const read = (key) =>
    key === "countries"
      ? state.countries
      : key === "places"
        ? state.places
        : state.regions[Number(key)];
  const write = (key, value) => {
    if (key === "countries" || key === "places") emit({ [key]: value });
    else {
      const regions = [...state.regions];
      regions[Number(key)] = value;
      emit({ regions });
    }
  };
  async function load(key, offset = 0, bypassCache = false) {
    if (!active) return;
    const ticket = (tickets.get(key) || 0) + 1;
    tickets.set(key, ticket);
    const epoch = generation,
      language_code = state.language;
    const index = key === "places" ? state.path.length : Number(key);
    const parent_id = index > 0 ? state.path[index - 1]?.id : null;
    const country = state.country?.country;
    const action =
      key === "countries"
        ? "listPlaceCountries"
        : key === "places"
          ? "listPlaceSettlements"
          : "listPlaceRegions";
    const payload =
      key === "countries"
        ? { language_code }
        : { country, parent_id, offset, language_code };
    const cacheKey = JSON.stringify([action, payload]);
    const previous = read(key) || resource();
    write(key, { ...previous, status: "LOADING", error: null });
    try {
      const cached = bypassCache ? null : cache.get(cacheKey);
      const result = cached || (await request(action, payload));
      if (!active || generation !== epoch || tickets.get(key) !== ticket)
        return;
      if (!Array.isArray(result?.options)) throw new Error("invalid list");
      if (!cached) cache.set(cacheKey, result);
      write(key, { ...resource(), ...result, status: "READY" });
    } catch (error) {
      if (active && generation === epoch && tickets.get(key) === ticket)
        write(key, {
          ...previous,
          offset,
          status: "ERROR",
          error:
            error.code === "PLACE_HIERARCHY_INCOMPLETE"
              ? "PLACE_HIERARCHY_INCOMPLETE"
              : "GEONAMES_UNAVAILABLE",
        });
    }
  }
  const invalidate = () => {
    generation++;
    tickets.clear();
  };
  const refresh = () => {
    const jobs = [load("countries")];
    if (state.country) {
      for (let i = 0; i <= state.path.length; i++) jobs.push(load(String(i)));
      jobs.push(load("places"));
    }
    return Promise.all(jobs);
  };
  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start: (language) => {
      active = true;
      invalidate();
      emit({ language });
      return state.editing ? refresh() : Promise.resolve();
    },
    dispose: () => {
      active = false;
      invalidate();
      cache.clear();
    },
    language: (language) => {
      if (state.language === language) return Promise.resolve();
      invalidate();
      emit({
        language,
        countries: resource(),
        regions: Array.from({ length: state.path.length + 1 }, resource),
        places: resource(),
      });
      return state.editing ? refresh() : Promise.resolve();
    },
    edit: () => {
      emit({ editing: true });
      return refresh();
    },
    clear: () => {
      invalidate();
      cache.clear();
      changed({
        country: null,
        path: [],
        regions: [],
        places: resource(),
        selection: null,
        incomplete: false,
        editing: true,
      });
      if (state.countries.status !== "READY") return load("countries");
      return Promise.resolve();
    },
    country: (id) => {
      const country = state.countries.options.find((x) => x.id === id);
      if (!country) return Promise.resolve();
      invalidate();
      changed({
        country,
        path: [],
        regions: [resource()],
        places: resource(),
        selection: null,
        incomplete: true,
      });
      return Promise.all([load("0"), load("places")]);
    },
    region: (index, id) => {
      const selected = state.regions[index]?.options.find(
        (x) => x.id === id && x.kind === "REGION",
      );
      if (!selected) return Promise.resolve();
      invalidate();
      const path = [...state.path.slice(0, index), selected];
      changed({
        path,
        regions: [
          ...state.regions
            .slice(0, index + 1)
            .map((row) =>
              row.status === "LOADING" ? { ...row, status: "READY" } : row,
            ),
          resource(),
        ],
        places: resource(),
        selection: null,
        incomplete: true,
      });
      return Promise.all([load(String(path.length)), load("places")]);
    },
    place: (id) => {
      const option = state.places.options.find(
        (x) => x.id === id && x.kind === "PLACE",
      );
      if (!option?.place) return;
      changed({ selection: option.place, incomplete: false });
    },
    page: (key, offset) => {
      const current = read(key);
      if (
        current.status === "LOADING" ||
        ![current.next_offset, current.previous_offset].includes(offset) ||
        offset === null
      )
        return Promise.resolve();
      return load(key, offset);
    },
    retry: (key) => {
      const current = read(key);
      return current?.status === "ERROR"
        ? load(key, current.offset, true)
        : Promise.resolve();
    },
  };
}
