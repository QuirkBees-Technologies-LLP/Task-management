import { Select } from "antd";
import { useEffect, useMemo, useState } from "react";


 //Generic Select component
 
const CommonSelect = ({
  value,
  onChange,

  // async function that returns data 
  fetcher,

  // optional filter function 
  filterFn,

  // map item -> { label, value }
  mapOption,

  placeholder = "Select",
  disabled = false,
  allowClear = false,
  showSearch = true,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fetcher) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetcher();
        setData(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to fetch select data", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetcher]);

  const options = useMemo(() => {
    const filtered = filterFn ? data.filter(filterFn) : data;
    return filtered.map(mapOption);
  }, [data, filterFn, mapOption]);

  return (
    <Select
      showSearch={showSearch}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      loading={loading}
      disabled={disabled}
      allowClear={allowClear}
      options={options}
    />
  );
};

export default CommonSelect;
