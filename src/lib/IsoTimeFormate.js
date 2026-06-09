// lib/IsoTimeFormate.js
const IsoTimeFormate = (timeStr) => {
  if (!timeStr) return "N/A";
  
  // If time string already has AM/PM, return it as is (but formatted nicely)
  if (timeStr.includes("AM") || timeStr.includes("PM")) {
    // Clean up the time string (remove extra spaces)
    const cleanTime = timeStr.replace(/\s+/g, ' ').trim();
    return cleanTime;
  }
  
  // If it's in 24-hour format (like "18:30")
  let [hours, minutes] = timeStr.split(":");
  hours = parseInt(hours);
  minutes = minutes ? minutes.replace(/\D/g, '') : "00";
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  let displayHours = hours % 12;
  displayHours = displayHours === 0 ? 12 : displayHours;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

export default IsoTimeFormate;