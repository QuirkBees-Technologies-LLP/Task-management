import { Input } from "antd";
import { debounce } from "lodash";
import { useEffect, useMemo, useCallback } from "react";

const DebouncedSearch = ({
  onSearch,
  delay = 500,
  placeholder = "Search organizations",
}) => {
  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        onSearch?.(value);
      }, delay),
    [onSearch, delay]
  );

  // Cleanup debounce
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleChange = useCallback((e) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  return (
    <Input.Search
      placeholder={placeholder}
      allowClear
      onChange={handleChange}
      style={{ width: 300 }} 
    />
  );
};

export default DebouncedSearch;
