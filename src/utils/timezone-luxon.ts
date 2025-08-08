import { DateTime } from "luxon";

/**
 * Centralized timezone utilities for the React admin dashboard.
 * All date/time operations should use America/Toronto timezone.
 * Backend stores UTC, we convert at API boundaries.
 */
export class AdminTimeUtil {
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
   * Parse datetime-local input (Toronto timezone) and convert to UTC for API
   * @param dateTimeInput - Input from datetime-local field (YYYY-MM-DDTHH:MM)
   * @returns UTC ISO string for API
   */
  static parseFromDateTimeInput(dateTimeInput: string): string {
    if (!dateTimeInput) {
      throw new Error("DateTime input is required");
    }

    try {
      // Parse as Toronto local time, then convert to UTC
      const dt = DateTime.fromISO(dateTimeInput, { zone: this.TIMEZONE });
      if (!dt.isValid) {
        throw new Error(`Invalid datetime format: ${dateTimeInput}`);
      }
      return dt.toUTC().toISO() ?? "";
    } catch (error) {
      console.error("Error parsing datetime input:", error);
      throw new Error(`Invalid datetime input: ${dateTimeInput}`);
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
   * Get current time in Toronto timezone
   * @returns Current DateTime object in Toronto timezone
   */
  static nowToronto(): DateTime {
    return DateTime.now().setZone(this.TIMEZONE);
  }

  /**
   * Get current UTC time
   * @returns Current DateTime object in UTC
   */
  static nowUTC(): DateTime {
    return DateTime.utc();
  }

  /**
   * Check if a date is during Daylight Saving Time in Toronto
   * @param date - Date to check (optional, defaults to now)
   * @returns true if DST is active
   */
  static isDaylightSavingTime(date?: Date | string): boolean {
    try {
      const dt = date
        ? DateTime.fromJSDate(new Date(date)).setZone(this.TIMEZONE)
        : this.nowToronto();

      return dt.offsetNameShort === "EDT";
    } catch (error) {
      console.error("Error checking DST:", error);
      return false;
    }
  }

  /**
   * Get timezone information for display
   * @param date - Date to get timezone info for (optional)
   * @returns Object with timezone details
   */
  static getTimezoneInfo(date?: Date | string): {
    timezone: string;
    abbreviation: string;
    offset: string;
    isDST: boolean;
  } {
    try {
      const dt = date
        ? DateTime.fromJSDate(new Date(date)).setZone(this.TIMEZONE)
        : this.nowToronto();

      return {
        timezone: this.TIMEZONE,
        abbreviation: dt.offsetNameShort ?? "EST",
        offset: dt.toFormat("ZZ"),
        isDST: this.isDaylightSavingTime(date),
      };
    } catch (error) {
      console.error("Error getting timezone info:", error);
      return {
        timezone: this.TIMEZONE,
        abbreviation: "EST",
        offset: "-05:00",
        isDST: false,
      };
    }
  }

  /**
   * Format operation hours range for display
   * @param openTime - Opening time in HH:MM format
   * @param closeTime - Closing time in HH:MM format
   * @returns Formatted range (e.g., "11:00 AM - 12:00 AM")
   */
  static formatOperationHours(openTime: string, closeTime: string): string {
    if (!openTime || !closeTime) return "Closed";

    try {
      const today = this.nowToronto().toFormat("yyyy-MM-dd");
      const openDt = DateTime.fromISO(`${today}T${openTime}`, {
        zone: this.TIMEZONE,
      });
      const closeDt = DateTime.fromISO(`${today}T${closeTime}`, {
        zone: this.TIMEZONE,
      });

      const openFormatted = openDt.toFormat("h:mm a");
      const closeFormatted = closeDt.toFormat("h:mm a");

      return `${openFormatted} - ${closeFormatted}`;
    } catch (error) {
      console.error("Error formatting operation hours:", error);
      return "Closed";
    }
  }

  /**
   * Check if current time is within business hours in Toronto
   * @param openTime - Opening time in HH:MM format
   * @param closeTime - Closing time in HH:MM format
   * @returns true if currently within business hours
   */
  static isWithinBusinessHours(openTime: string, closeTime: string): boolean {
    try {
      if (!openTime || !closeTime) return false;

      const now = this.nowToronto();
      const today = now.toFormat("yyyy-MM-dd");

      const openDt = DateTime.fromISO(`${today}T${openTime}`, {
        zone: this.TIMEZONE,
      });
      let closeDt = DateTime.fromISO(`${today}T${closeTime}`, {
        zone: this.TIMEZONE,
      });

      // Handle overnight hours (e.g., 22:00 to 02:00 next day)
      if (closeDt <= openDt) {
        closeDt = closeDt.plus({ days: 1 });
      }

      return now >= openDt && now <= closeDt;
    } catch (error) {
      console.error("Error checking business hours:", error);
      return false;
    }
  }

  /**
   * Validate if a string represents a valid datetime
   * @param dateString - String to validate
   * @returns true if valid
   */
  static isValidDateTime(dateString: string): boolean {
    if (!dateString) return false;
    try {
      const dt = DateTime.fromJSDate(new Date(dateString));
      return dt.isValid;
    } catch {
      return false;
    }
  }
}

// Keep backward compatibility with old class name
export class AdminTimezoneUtil extends AdminTimeUtil {}
