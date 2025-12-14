// src/Components/Footer.js
export default function Footer({ brand = "VOX" }) {
  return (
    <footer className="footer">
      <small>© {new Date().getFullYear()} {brand}</small>
    </footer>
  );
}
