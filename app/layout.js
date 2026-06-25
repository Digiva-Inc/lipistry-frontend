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
  description: "Secure practitioner account management and Shopify order routing for Lipistry field sales reps.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-100 relative overflow-x-hidden selection:bg-pink-500/30 selection:text-pink-200">
        {/* Ambient backdrop glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ambient-light-pink rounded-full pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] ambient-light-blue rounded-full pointer-events-none z-0" />
        
        <main className="relative z-10 flex-1 flex flex-col">
          {children}
        </main>
        
        <Toaster position="top-right" theme="dark" richColors closeButton />
      </body>
    </html>
  );
}
