export const metadata = {
    title: 'Zelle to Breeze Converter',
    description: 'Convert Zelle data to BreezeCMS format',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body>{children}</body>
        </html>
    );
}
