import { formatTimeTo24Hour } from './lib/dateUtils.js';

console.log("Original -> Converted");
console.log("02:30 PM ->", formatTimeTo24Hour("02:30 PM"));
console.log("12:00 AM ->", formatTimeTo24Hour("12:00 AM"));
console.log("12:30 PM ->", formatTimeTo24Hour("12:30 PM"));
console.log("01:15 AM ->", formatTimeTo24Hour("01:15 AM"));
console.log("14:45 ->", formatTimeTo24Hour("14:45"));
console.log("09:00 ->", formatTimeTo24Hour("09:00"));
console.log("invalid ->", formatTimeTo24Hour("invalid"));
