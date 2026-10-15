export class DateUtils {
  /**
   * Checks if two dates represent the same calendar day (ignoring time).
   */
  static isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }

  /**
   * Checks if the given date is Today.
   */
  static isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }

  /**
   * Formats a date as 'yyyy-MM-dd' for HTML <input type="date">
   * Use this for [value] and [max] bindings.
   */
  static toISODate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
