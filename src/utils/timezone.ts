import { DateTime } from "luxon";

/**
 * Centralized timezone utilities for the Admin Dashboard.
 * All date/time operations use America/Toronto timezone.
 * Backend stores UTC, we convert at API boundaries.
 */
export class AdminTimezoneUtil {
  private static readonly TIMEZONE = "America/Toronto";

  /**
   * Convert UTC date from API to Toronto timezone for display
   * @param utcDateLike - UTC date string or Date object from API
   * @param format - Display format (default: human readable)
   * @returns Formatted string in Toronto timezone
   */
  static formatToronto(
    utcDateLike: string | Date | null | undefined,
    format = "MMMM d, yyyy h:mm a"
  ): string {
    if (!utcDateLike) return "";

    try {
      const dt = DateTime.fromJSDate(new Date(utcDateLike), {
        zone: "utc",
      }).setZone(this.TIMEZONE);

      return dt.toFormat(format);
    } catch (error) {
      console.error("Error formatting Toronto time:", error);
      return String(utcDateLike);
    }
  }

  /**
   * Convert Toronto local input to UTC ISO string for API
   * Use this when sending datetime values to the backend
   * @param torontoLocal - Date input assumed to be in Toronto timezone
   * @returns UTC ISO string for API
   */
  static parseTorontoInputToISO(torontoLocal: string | Date): string {
    if (!torontoLocal) {
      throw new Error("Toronto local date is required");
    }

    try {
      const dt = DateTime.fromJSDate(new Date(torontoLocal), {
        zone: this.TIMEZONE,
      });
      return dt.toUTC().toISO() ?? "";
    } catch (error) {
      console.error("Error parsing Toronto input:", error);
      throw new Error(`Invalid date format: ${torontoLocal}`);
    }
  }

  /**
   * Format UTC date for datetime-local input (Toronto timezone)
   * @param utcDateLike - UTC date from API
   * @returns String in YYYY-MM-DDTHH:MM format for HTML datetime-local inputs
   */
  static formatForDateTimeInput(utcDateLike: string | Date | null): string {
    if (!utcDateLike) return "";

    try {
      const dt = DateTime.fromJSDate(new Date(utcDateLike), {
        zone: "utc",
      }).setZone(this.TIMEZONE);

      return dt.toFormat("yyyy-MM-dd'T'HH:mm");
    } catch (error) {
      console.error("Error formatting for datetime input:", error);
      return "";
    }
  }

  /**
   * Format date only (no time) for display in Toronto timezone
   * @param utcDateLike - UTC date from API
   * @returns Formatted date string
   */
  static formatTorontoDate(utcDateLike: string | Date | null): string {
    return this.formatToronto(utcDateLike, "MMMM d, yyyy");
  }

  /**
   * Format time only (no date) for display in Toronto timezone
   * @param utcDateLike - UTC date from API
   * @returns Formatted time string
   */
  static formatTorontoTime(utcDateLike: string | Date | null): string {
    return this.formatToronto(utcDateLike, "h:mm a");
  }

  /**
   * Get current date/time in Toronto timezone
   * @returns DateTime object in Toronto timezone
   */
  static getCurrentTorontoTime(): DateTime {
    return DateTime.now().setZone(this.TIMEZONE);
  }

  /**
   * Check if a date is in Daylight Saving Time
   * @param date - Date to check (defaults to current time)
   * @returns true if DST is active
   */
  static isDST(date?: Date): boolean {
    const dt = date
      ? DateTime.fromJSDate(date, { zone: this.TIMEZONE })
      : DateTime.now().setZone(this.TIMEZONE);
    return dt.isInDST;
  }

  /**
   * Get timezone info for a given date
   * @param date - Date to get timezone info for (defaults to current time)
   * @returns Object with timezone information
   */
  static getTimezoneInfo(date?: Date): {
    timezone: string;
    abbreviation: string;
    offset: string;
    isDST: boolean;
  } {
    const dt = date
      ? DateTime.fromJSDate(date, { zone: this.TIMEZONE })
      : DateTime.now().setZone(this.TIMEZONE);

    return {
      timezone: this.TIMEZONE,
      abbreviation: dt.offsetNameShort || "ET",
      offset: dt.toFormat("ZZ"),
      isDST: dt.isInDST,
    };
  }

  /**
   * Format current Toronto time for display in clock
   * @returns Formatted time string with date
   */
  static formatCurrentTime(): string {
    return this.getCurrentTorontoTime().toFormat("EEE, MMM d, yyyy h:mm:ss a");
  }

  /**
   * Get short timezone abbreviation (EST/EDT)
   * @returns Timezone abbreviation
   */
  static getTimezoneAbbr(): string {
    const dt = DateTime.now().setZone(this.TIMEZONE);
    return dt.offsetNameShort || "ET";
  }

  /**
   * Get current time in Toronto timezone
   */
  static now(): Date {
    return new Date();
  }

  /**
   * Format time for display (time only)
   */
  static formatTorontoTimeOnly(date: string | Date): string {
    return this.formatToronto(date, "h:mm a");
  }

  /**
   * Format for data tables and lists
   */
  static formatForTable(date: string | Date): string {
    return this.formatToronto(date, "MMM d, yyyy h:mm a");
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
   * Get basic timezone information for display
   */
  static getBasicTimezoneInfo(): {
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
      const parsed = new Date(dateTimeString);
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
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

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
