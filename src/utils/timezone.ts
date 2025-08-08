// Timezone utility for admin dashboard
export class AdminTimezoneUtil {
  private static readonly TIMEZONE = "America/Toronto";

  /**
   * Convert any date to Toronto timezone and format for display
   */
  static formatTorontoTime(
    date: string | Date,
    options?: Intl.DateTimeFormatOptions
  ): string {
    if (!date) return "";

    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;

      const defaultOptions: Intl.DateTimeFormatOptions = {
        timeZone: this.TIMEZONE,
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        ...options,
      };

      return new Intl.DateTimeFormat("en-US", defaultOptions).format(dateObj);
    } catch (error) {
      console.error("Error formatting date:", error);
      return typeof date === "string" ? date : date.toString();
    }
  }

  /**
   * Format datetime for form inputs (YYYY-MM-DDTHH:MM format in Toronto timezone)
   */
  static formatForInput(date: string | Date): string {
    if (!date) return "";

    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;

      // Convert to Toronto timezone and format for datetime-local input
      const torontoTime = new Intl.DateTimeFormat("sv-SE", {
        timeZone: this.TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj);

      return torontoTime.replace(" ", "T");
    } catch (error) {
      console.error("Error formatting for input:", error);
      return "";
    }
  }

  /**
   * Parse datetime from form input and convert to UTC
   */
  static parseFromInput(dateTimeString: string): Date {
    if (!dateTimeString) return new Date();

    try {
      // Treat the input as Toronto time and convert to UTC
      const [datePart, timePart] = dateTimeString.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute] = timePart.split(":").map(Number);

      // Create date in Toronto timezone
      const torontoDate = new Date();
      torontoDate.setFullYear(year);
      torontoDate.setMonth(month - 1); // Month is 0-indexed
      torontoDate.setDate(day);
      torontoDate.setHours(hour);
      torontoDate.setMinutes(minute);
      torontoDate.setSeconds(0);
      torontoDate.setMilliseconds(0);

      // Adjust for timezone offset
      const offsetMs = this.getTorontoOffsetMs(torontoDate);
      return new Date(torontoDate.getTime() - offsetMs);
    } catch (error) {
      console.error("Error parsing from input:", error);
      return new Date();
    }
  }

  /**
   * Get Toronto timezone offset in milliseconds
   */
  private static getTorontoOffsetMs(date: Date): number {
    const utc = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    const torontoTime = new Date(
      utc.toLocaleString("en-US", { timeZone: this.TIMEZONE })
    );
    return torontoTime.getTime() - date.getTime();
  }

  /**
   * Format date for display (date only)
   */
  static formatTorontoDate(date: string | Date): string {
    return this.formatTorontoTime(date, {
      hour: undefined,
      minute: undefined,
      hour12: undefined,
    });
  }

  /**
   * Format time for display (time only)
   */
  static formatTorontoTimeOnly(date: string | Date): string {
    return this.formatTorontoTime(date, {
      year: undefined,
      month: undefined,
      day: undefined,
    });
  }

  /**
   * Get current time in Toronto timezone
   */
  static now(): Date {
    return new Date();
  }

  /**
   * Format for data tables and lists
   */
  static formatForTable(date: string | Date): string {
    return this.formatTorontoTime(date, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  /**
   * Format operation hours for admin display
   */
  static formatOperationHours(openTime: string, closeTime: string): string {
    try {
      // Create date objects for today with the given times
      const today = new Date().toISOString().split("T")[0];
      const openDateTime = new Date(`${today}T${openTime}`);
      const closeDateTime = new Date(`${today}T${closeTime}`);

      const openFormatted = this.formatTorontoTimeOnly(openDateTime);
      const closeFormatted = this.formatTorontoTimeOnly(closeDateTime);

      return `${openFormatted} - ${closeFormatted}`;
    } catch (error) {
      console.error("Error formatting operation hours:", error);
      return `${openTime} - ${closeTime}`;
    }
  }

  /**
   * Get timezone information for display
   */
  static getTimezoneInfo(): {
    timezone: string;
    offset: string;
    abbreviation: string;
  } {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en", {
        timeZone: this.TIMEZONE,
        timeZoneName: "short",
      });

      const parts = formatter.formatToParts(now);
      const timeZoneName =
        parts.find((part) => part.type === "timeZoneName")?.value || "EST/EDT";

      // Get offset
      const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
      const torontoTime = new Date(
        utc.toLocaleString("en-US", { timeZone: this.TIMEZONE })
      );
      const offsetMs =
        torontoTime.getTime() - now.getTime() + now.getTimezoneOffset() * 60000;
      const offsetHours = Math.floor(offsetMs / (1000 * 60 * 60));
      const offsetMinutes = Math.abs(
        Math.floor((offsetMs % (1000 * 60 * 60)) / (1000 * 60))
      );
      const offsetString = `${
        offsetHours >= 0 ? "+" : ""
      }${offsetHours}:${offsetMinutes.toString().padStart(2, "0")}`;

      return {
        timezone: this.TIMEZONE,
        offset: offsetString,
        abbreviation: timeZoneName,
      };
    } catch (error) {
      console.error("Error getting timezone info:", error);
      return {
        timezone: this.TIMEZONE,
        offset: "-05:00",
        abbreviation: "EST/EDT",
      };
    }
  }

  /**
   * Validate datetime input format
   */
  static isValidDateTime(dateTimeString: string): boolean {
    if (!dateTimeString) return false;

    try {
      const parsed = this.parseFromInput(dateTimeString);
      return !isNaN(parsed.getTime());
    } catch {
      return false;
    }
  }

  /**
   * Get relative time description for admin use
   */
  static getRelativeTime(date: string | Date): string {
    try {
      const targetDate = typeof date === "string" ? new Date(date) : date;
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.ceil(diffMs / (1000 * 60));

      if (Math.abs(diffDays) >= 1) {
        return diffDays > 0
          ? `in ${diffDays} day${diffDays > 1 ? "s" : ""}`
          : `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""} ago`;
      } else if (Math.abs(diffHours) >= 1) {
        return diffHours > 0
          ? `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`
          : `${Math.abs(diffHours)} hour${
              Math.abs(diffHours) > 1 ? "s" : ""
            } ago`;
      } else if (Math.abs(diffMinutes) >= 1) {
        return diffMinutes > 0
          ? `in ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`
          : `${Math.abs(diffMinutes)} minute${
              Math.abs(diffMinutes) > 1 ? "s" : ""
            } ago`;
      } else {
        return "now";
      }
    } catch (error) {
      console.error("Error getting relative time:", error);
      return "";
    }
  }

  /**
   * Create a timezone-aware date range for filtering
   */
  static createDateRange(
    startDate: string,
    endDate: string
  ): { start: Date; end: Date } {
    const start = this.parseFromInput(`${startDate}T00:00`);
    const end = this.parseFromInput(`${endDate}T23:59`);

    return { start, end };
  }

  /**
   * Format time string for time input fields (HH:MM format)
   * Used specifically for operation hours
   */
  static formatTimeForInput(timeString: string): string {
    if (!timeString) return "";

    try {
      // Ensure the time is in HH:MM format
      const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
      if (!timeMatch) return "";

      const hours = timeMatch[1].padStart(2, "0");
      const minutes = timeMatch[2];

      return `${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting time for input:", error);
      return "";
    }
  }

  /**
   * Parse time from input field and ensure proper format
   * Used for operation hours - assumes input is in Toronto time
   */
  static parseTimeFromInput(timeString: string): string {
    if (!timeString) return "";

    try {
      const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})$/);
      if (!timeMatch) {
        throw new Error("Invalid time format. Expected HH:MM");
      }

      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);

      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error("Invalid time values");
      }

      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    } catch (error) {
      console.error("Error parsing time from input:", error);
      throw error;
    }
  }

  /**
   * Format time for display (12-hour format with AM/PM)
   */
  static formatTimeForDisplay(timeString: string): string {
    if (!timeString) return "";

    try {
      const [hours, minutes] = timeString.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);

      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: this.TIMEZONE,
      }).format(date);
    } catch (error) {
      console.error("Error formatting time for display:", error);
      return timeString;
    }
  }

  /**
   * Validate time input format
   */
  static isValidTime(timeString: string): boolean {
    if (!timeString) return false;

    try {
      this.parseTimeFromInput(timeString);
      return true;
    } catch {
      return false;
    }
  }
}
