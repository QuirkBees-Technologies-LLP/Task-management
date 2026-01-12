import { Select } from "antd";
import { useEffect, useMemo, useState } from "react";
import { plansAPI } from "../services/api";

const PlanSelect = ({
  value,
  onChange,
  onlyActive = true,
  placeholder = "Search & select a plan",
  disabled = false,
  allowClear = false,
}) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const res = await plansAPI.list();
        setPlans(Array.isArray(res.data?.plans) ? res.data.plans : []);
      } catch (error) {
        console.error("Failed to fetch plans", error);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const options = useMemo(() => {
    const filtered = onlyActive ? plans.filter(p => p.status === "active") : plans;
    return filtered.map(plan => ({
      label: plan.plan_name,
      value: plan._id,
    }));
  }, [plans, onlyActive]);
  
  return (
    <Select
      showSearch
      value={value}
      defaultValue={value}
      onChange={onChange}
      placeholder={placeholder}
      loading={loading}
      disabled={disabled}
      allowClear={allowClear}
      options={options}
    />
  );
};

export default PlanSelect;
