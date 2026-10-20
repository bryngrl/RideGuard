import { useMemo, useState } from "react";
import { settingsRows } from "../config/settings-rows";
import { useSearchHistory } from "./use-search-history";
export function useSettingsSearch() {
  const [query, setQuery] = useState("");
  const history = useSearchHistory();
  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return settingsRows
      .map((row) => {
        const title = row.title.toLowerCase();
        let rank = -1;
        if (title.startsWith(value)) rank = 0;
        else if (title.split(/\s+/).some((word) => word.startsWith(value))) rank = 1;
        else if (title.includes(value)) rank = 2;
        else if (value.length > 1 && row.searchKeywords.some((keyword) => keyword.toLowerCase().includes(value))) rank = 3;
        return { row, rank };
      })
      .filter(({ rank }) => rank >= 0)
      .sort((a, b) => a.rank - b.rank)
      .map(({ row }) => row);
  }, [query]);
  return { query, setQuery, results, ...history };
}
