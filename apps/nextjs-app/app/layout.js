export const metadata = { title: "Monitoring Lab", description: "Traffic generator for the monitoring lab" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}
