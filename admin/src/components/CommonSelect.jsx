import { FormControl, InputLabel, Select, MenuItem, CircularProgress, Chip, Box } from "@mui/material";
import { useEffect, useMemo, useState, useCallback } from "react";
import { styled } from "@mui/material/styles";

const StyledSelect = styled(Select)({
  minWidth: 150,
  maxWidth: 300,
});

const ClearIndicator = styled("div")(({ theme }) => ({
  position: "absolute",
  right: 8,
  top: "50%",
  transform: "translateY(-50%)",
  cursor: "pointer",
  color: theme.palette.text.secondary,
  "&:hover": {
    color: theme.palette.text.primary,
  },
}));

// Generic Select component
const CommonSelect = ({
  value,
  onChange,
  fetcher,
  filterFn,
  mapOption, // ❌ Can be undefined
  placeholder = "Select",
  disabled = false,
  allowClear = false,
  showSearch = true,
  options: staticOptions, // ✅ New prop for static options
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

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

  // ✅ Fixed: Ensure mapOption exists and handle both static options and dynamic data
  const processedOptions = useMemo(() => {
    // If static options provided, use them directly
    if (staticOptions) {
      return Array.isArray(staticOptions) ? staticOptions : [];
    }

    // Otherwise process dynamic data
    if (!Array.isArray(data) || !mapOption || typeof mapOption !== 'function') {
      return [];
    }

    const filtered = filterFn ? data.filter(filterFn) : data;
    return filtered.map(mapOption);
  }, [data, filterFn, mapOption, staticOptions]);

  const handleClear = useCallback(() => {
    if (onChange) {
      onChange(null);
    }
    setInputValue("");
  }, [onChange]);

  const selectedOption = useMemo(() => {
    return processedOptions.find(option => option.value === value);
  }, [processedOptions, value]);

  const displayValue = selectedOption ? selectedOption.label : placeholder;

  return (
    <FormControl sx={{ minWidth: 150 }} size="small" disabled={disabled}>
      <InputLabel sx={{ display: "none" }}>{placeholder}</InputLabel>
      <StyledSelect
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        value={value || ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        displayEmpty
        disabled={disabled || loading}
        renderValue={(selected) => {
          if (selected === "" || !selected) {
            return (
              <Box sx={{ color: "text.secondary", fontStyle: "italic" }}>
                {placeholder}
              </Box>
            );
          }
          return selectedOption?.label || selected;
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 224,
            },
          },
        }}
        endAdornment={
          loading ? (
            <CircularProgress size={20} sx={{ mr: 1 }} />
          ) : allowClear && value ? (
            <ClearIndicator onClick={handleClear}>
              <Chip
                label="×"
                size="small"
                sx={{ 
                  height: 20, 
                  fontSize: "12px", 
                  fontWeight: 500,
                  backgroundColor: "transparent",
                  color: "inherit",
                }}
              />
            </ClearIndicator>
          ) : null
        }
      >
        {processedOptions.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{
              ...(showSearch && {
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }),
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </StyledSelect>
    </FormControl>
  );
};

export default CommonSelect;
