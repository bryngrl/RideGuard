import { useMemo, useState } from "react";
import { settingsRows } from "../config/settings-rows";
import { useSearchHistory } from "./use-search-history";
export function useSettingsSearch() {
  const [query, setQuery] = useState("");
  const history = useSearchHistory();
  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return settingsRows.filter((row) =>
      `${row.title} ${row.section} ${row.searchKeywords.join(" ")}`
        .toLowerCase()
        .includes(value),
    );
  }, [query]);
  return { query, setQuery, results, ...history };
}
