import React, { createContext, useState } from "react";
import type { ReactNode } from "react";
import { Snackbar, Alert } from "@mui/material";
import type { AlertColor } from "@mui/material";

interface ApiError {
  response?: {
    data?: {
      userMessage?: string;
      message?: string;
    };
  };
  message?: string;
}

interface NotificationContextType {
  showNotification: (
    message: string,
    severity?: AlertColor,
    duration?: number
  ) => void;
  showError: (error: ApiError | Error | string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export { NotificationContext };

interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
  duration: number;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: "info",
    duration: 6000,
  });

  const showNotification = (
    message: string,
    severity: AlertColor = "info",
    duration: number = 6000
  ) => {
    setNotification({
      open: true,
      message,
      severity,
      duration,
    });
  };

  const showError = (error: ApiError | Error | string) => {
    let message = "An unexpected error occurred";

    if (typeof error === "string") {
      message = error;
    } else if ("response" in error && error.response?.data?.userMessage) {
      message = error.response.data.userMessage;
    } else if ("response" in error && error.response?.data?.message) {
      message = error.response.data.message;
    } else if ("message" in error && error.message) {
      message = error.message;
    }

    showNotification(message, "error", 8000);
  };

  const showSuccess = (message: string) => {
    showNotification(message, "success", 4000);
  };

  const showWarning = (message: string) => {
    showNotification(message, "warning", 6000);
  };

  const showInfo = (message: string) => {
    showNotification(message, "info", 5000);
  };

  const handleClose = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const value: NotificationContextType = {
    showNotification,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{ zIndex: 9999 }}
      >
        <Alert
          onClose={handleClose}
          severity={notification.severity}
          variant="filled"
          sx={{
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            minWidth: "300px",
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
