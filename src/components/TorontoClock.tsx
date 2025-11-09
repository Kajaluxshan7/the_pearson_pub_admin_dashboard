import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { AdminTimeUtil } from "../utils/timezone-luxon";

/**
 * TorontoClock Component
 *
 * Displays the current time in America/Toronto timezone
 * Updates every second to show live clock
 * Includes timezone abbreviation (EST/EDT) for DST awareness
 */
const TorontoClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>(
    AdminTimeUtil.formatCurrentTime()
  );
  const [timezoneAbbr, setTimezoneAbbr] = useState<string>(
    AdminTimeUtil.getTimezoneAbbr()
  );

  useEffect(() => {
    // Update time every second
    const intervalId = setInterval(() => {
      setCurrentTime(AdminTimeUtil.formatCurrentTime());
      // Update timezone abbreviation (in case DST changes during session)
      setTimezoneAbbr(AdminTimeUtil.getTimezoneAbbr());
    }, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        padding: "8px 16px",
        backgroundColor: "background.paper",
        borderRadius: 1,
        boxShadow: 1,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontFamily: "monospace",
          fontSize: "0.9rem",
          fontWeight: 500,
          color: "text.primary",
        }}
      >
        {currentTime}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          padding: "2px 6px",
          backgroundColor: "primary.main",
          color: "primary.contrastText",
          borderRadius: 0.5,
          fontWeight: 600,
          fontSize: "0.7rem",
        }}
      >
        {timezoneAbbr}
      </Typography>
    </Box>
  );
};

export default TorontoClock;
