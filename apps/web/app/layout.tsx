import type { Metadata } from "next";
import { Inter, Noto_Sans_Khmer } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansKhmer = Noto_Sans_Khmer({
  subsets: ["khmer"],
  variable: "--font-khmer",
  weight: ["100", "300", "400", "500", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "Prahok - ឧបករណ៍អភិវឌ្ឍន៍សម្រាប់អ្នកសរសេរកូដខ្មែរ",
  description: "បង្កើតកម្មវិធីដ៏អស្ចារ្យជាមួយ AI ជាភាសាខ្មែរ",
  keywords: "Khmer developer tools, Cambodia tech, ឧបករណ៍អភិវឌ្ឍន៍, កូដខ្មែរ",
  other: {
    "google": "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="km" 
      className={`${inter.variable} ${notoSansKhmer.variable}`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="font-sans notranslate" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}