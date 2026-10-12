import { useSettingsStore } from "../store/settings.store";
export function useSearchHistory() {
  return {
    history: useSettingsStore((state) => state.searchHistory),
    add: useSettingsStore((state) => state.addSearchHistory),
    clear: useSettingsStore((state) => state.clearSearchHistory),
  };
}
