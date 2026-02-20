"use client";

import React from "react";
import Grid from "@mui/material/Grid";
import { Paper, Box } from "@mui/material";
import BasicBarChart from "@/components/charts/BasicBarChart";
import PageHeader from "@/components/PageHeader";
import CardHeader from "@/components/CardHeader";

export default function ChartsPage() {
  return (
    <>


      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper>
            <Box sx={{ p: 3 }}>
              <CardHeader title="Basic Bar Chart" />
              <Box sx={{ mt: 3, width: "100%", minHeight: 400 }}>
                <BasicBarChart height={400} />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
