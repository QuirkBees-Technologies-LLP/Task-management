import { Input } from "antd";
import { debounce } from "lodash";
import { useEffect, useMemo, useState, useCallback } from "react";
import { organizationAPI } from "../services/api";

const OrganizationSearch = () => {
  const [search, setSearch] = useState("");

  // Debounced setter
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setSearch(value);
      }, 500),
    []
  );

  // Cleanup debounce
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // API call
  const fetchData = useCallback(() => {
    organizationAPI.getAll({ search });
  }, [search]);

  // Trigger API when search changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Input.Search
      placeholder="Search organizations"
      allowClear
      onChange={(e) => debouncedSearch(e.target.value)}
      style={{ width: 300 }}
    />
  );
};

export default OrganizationSearch;
