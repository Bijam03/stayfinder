// Safely format a UTC date string without timezone shift
// MongoDB stores dates as midnight UTC — we display them as-is
export const formatDate = (dateStr, pattern = "dd MMM yyyy") => {
  if (!dateStr) return "";

  // Parse the UTC date and manually extract year/month/day
  // to avoid local timezone converting May 18 00:00 UTC → May 17 local
  const d = new Date(dateStr);
  const year  = d.getUTCFullYear();
  const month = d.getUTCMonth(); // 0-indexed
  const day   = d.getUTCDate();

  // Create a local date using UTC values — no shift
  const localDate = new Date(year, month, day);

  // Use date-fns format on the corrected date
//   const { format } = require ? window.__dateFns : { format: null };  //changed......

  // Manual formatting without date-fns dependency
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  if (pattern === "dd MMM yyyy") {
    return `${String(day).padStart(2,"0")} ${months[month]} ${year}`;
  }
  if (pattern === "MMMM yyyy") {
    const fullMonths = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    return `${fullMonths[month]} ${year}`;
  }
  if (pattern === "dd MMM") {
    return `${String(day).padStart(2,"0")} ${months[month]}`;
  }

  return localDate.toLocaleDateString();
};