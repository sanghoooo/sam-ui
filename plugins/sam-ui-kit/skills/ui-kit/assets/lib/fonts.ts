import localFont from "next/font/local";

// Pretendard 1.3.9 variable (github.com/orioncactus/pretendard), SIL Open Font License: fonts/OFL.txt.
export const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
  fallback: ["Arial", "sans-serif"],
});
