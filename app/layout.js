export const metadata = {
  title: "Ella Fitness CRM",
  description: "Sistema de gestão para lojas fitness",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{margin:0,padding:0,background:"#07070f"}}>
        {children}
      </body>
    </html>
  );
}
