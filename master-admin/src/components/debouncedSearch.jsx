import { TextField, InputAdornment } from "@mui/material";
import { Clear, Search } from "@mui/icons-material";
import { debounce } from "lodash";
import { useEffect, useMemo, useCallback, useState } from "react";
import { styled } from "@mui/material/styles";

const StyledTextField = styled(TextField)({
  width: 300,
  "& .MuiInputBase-root": {
    borderRadius: 6,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#d9d9d9",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#40a9ff",
  },
  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#40a9ff",
    borderWidth: 2,
  },
});

const DebouncedSearch = ({
  onSearch,
  delay = 500,
  placeholder = "Search organizations",
}) => {
  const [value, setValue] = useState("");

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((searchValue) => {
        onSearch?.(searchValue);
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
    const newValue = e.target.value;
    setValue(newValue);
    debouncedSearch(newValue);
  }, [debouncedSearch]);

  const handleClear = useCallback(() => {
    setValue("");
    debouncedSearch("");
    onSearch?.("");
  }, [onSearch, debouncedSearch]);

  return (
    <StyledTextField
      variant="outlined"
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search />
          </InputAdornment>
        ),
        endAdornment: value && (
          <InputAdornment
            position="end"
            sx={{ cursor: "pointer" }}
            onClick={handleClear}
          >
            <Clear />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default DebouncedSearch;
