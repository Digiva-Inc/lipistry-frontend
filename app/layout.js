import { Outfit, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Lipistry | Sales Representative Portal",
  description:
    "Secure practitioner account management and order routing for Lipistry field sales reps.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full`}
    >
      <body className="h-screen overflow-hidden font-sans relative">
        {/* Ambient backdrop glow */}
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] ambient-light-pink rounded-full pointer-events-none -z-10" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] ambient-light-blue rounded-full pointer-events-none -z-10" />

        {children}

        <Toaster
          position="top-right"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}