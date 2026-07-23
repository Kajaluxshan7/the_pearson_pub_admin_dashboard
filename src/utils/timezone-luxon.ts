import { DateTime } from "luxon";

/**
 * Centralized timezone utilities for the React admin dashboard.
 * All date/time operations should use America/Toronto timezone.
 * Backend stores UTC, we convert at API boundaries.
 */
export class AdminTimeUtil {
  private static readonly TIMEZONE = "America/Toronto";

  private static readonly DAY_NAMES = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;

  /**
   * Parse any date-like value into a Luxon DateTime in Toronto time.
   *
   * Parsing rules:
   * - A `Date` keeps its instant and is re-zoned to Toronto.
   * - A string carrying an offset (`...Z`, `+05:30`) has a well-defined
   *   instant, which is converted to Toronto.
   * - A string WITHOUT an offset (`2025-08-15`, `2025-08-15T19:30`) is
   *   interpreted as Toronto wall-clock time, never as browser-local time.
   *
   * That last rule is what keeps rendering independent of the admin's
   * machine timezone.
   *
   * @param value - Date-like value from the API or a form input
   * @returns A DateTime in Toronto zone, or null if unparseable
   */
  private static toToronto(
    value: string | Date | null | undefined
  ): DateTime | null {
    if (!value) return null;

    const dt =
      value instanceof Date
        ? DateTime.fromJSDate(value).setZone(this.TIMEZONE)
        : DateTime.fromISO(value.trim(), { zone: this.TIMEZONE });

    return dt.isValid ? dt : null;
  }

  /**
   * Convert time in HH:MM (or HH:MM:SS) form to minutes since midnight
   */
  private static timeToMinutes(timeString: string): number | null {
    const [hours, minutes] = timeString.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
  }

  /**
   * Convert UTC date from API to Toronto timezone for display
   * @param utcDateLike - UTC date string or Date object from API
   * @param format - Display format (default: human readable)
   * @returns Formatted string in Toronto timezone
   */
  static formatToronto(
    utcDateLike: string | Date | null | undefined,
    format = "MMMM d, yyyy h:mm a",
    includeTimezone = false
  ): string {
    if (!utcDateLike) return "";

    try {
      const dt = this.toToronto(utcDateLike);
      if (!dt) return String(utcDateLike);

      const formatted = dt.toFormat(format);
      if (includeTimezone) {
        const tzAbbr = dt.offsetNameShort ?? "EST";
        return `${formatted} ${tzAbbr}`;
      }
      return formatted;
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
      // NOTE: DateTime.fromJSDate(d, { zone }) must NOT be used here - its
      // `zone` option only changes rendering, it does not reinterpret the
      // wall-clock time, so it would silently pass the input through
      // unchanged after `new Date()` had already parsed it as browser-local.
      const dt = this.toToronto(torontoLocal);
      if (!dt) throw new Error(`Invalid date format: ${String(torontoLocal)}`);
      return dt.toUTC().toISO() ?? "";
    } catch (error) {
      console.error("Error parsing Toronto input:", error);
      throw new Error(`Invalid date format: ${String(torontoLocal)}`);
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
      const dt = this.toToronto(utcDateLike);
      return dt ? dt.toFormat("yyyy-MM-dd'T'HH:mm") : "";
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
    return this.formatToronto(utcDateLike, "MMMM d, yyyy", false);
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
        ? (this.toToronto(date) ?? this.nowToronto())
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
        ? (this.toToronto(date) ?? this.nowToronto())
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
  static isWithinBusinessHours(
    openTime: string,
    closeTime: string,
    day?: string
  ): boolean {
    try {
      if (!openTime || !closeTime) return false;

      const now = this.nowToronto();
      const currentMinutes = now.hour * 60 + now.minute;
      const openMinutes = this.timeToMinutes(openTime);
      const closeMinutes = this.timeToMinutes(closeTime);

      if (openMinutes === null || closeMinutes === null) return false;

      // Luxon weekday is 1 (Monday) .. 7 (Sunday); `% 7` maps Sunday to index 0
      const todayName = this.DAY_NAMES[now.weekday % 7];
      const isOvernight = closeMinutes < openMinutes;

      // No specific day given: evaluate the hours against today only.
      if (!day) {
        return isOvernight
          ? currentMinutes >= openMinutes || currentMinutes < closeMinutes
          : currentMinutes >= openMinutes && currentMinutes < closeMinutes;
      }

      const targetDay = day.toLowerCase();

      if (isOvernight) {
        // An overnight block belongs to `targetDay` but spills into the day
        // after it, so it can be live during either of those two calendar days.
        if (todayName === targetDay && currentMinutes >= openMinutes) {
          return true;
        }

        const targetIndex = this.DAY_NAMES.indexOf(
          targetDay as (typeof this.DAY_NAMES)[number]
        );
        if (targetIndex === -1) return false;

        const nextDay = this.DAY_NAMES[(targetIndex + 1) % 7];
        return todayName === nextDay && currentMinutes < closeMinutes;
      }

      if (todayName !== targetDay) return false;

      return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
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
      return this.toToronto(dateString) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Format current Toronto time for display in clock
   * @returns Formatted time string with date
   */
  static formatCurrentTime(): string {
    return this.nowToronto().toFormat("EEE, MMM d, yyyy h:mm:ss a");
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
   * Format for compact clock display
   * @returns Formatted time string
   */
  static formatCompactTime(): string {
    return this.nowToronto().toFormat("h:mm:ss a");
  }

  /**
   * Format for full clock display with date
   * @returns Formatted time string with full date
   */
  static formatFullDateTime(): string {
    return this.nowToronto().toFormat("EEEE, MMMM d, yyyy - h:mm:ss a");
  }
}

// Keep backward compatibility with old class name
export class AdminTimezoneUtil extends AdminTimeUtil {}
