import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p>
          DAuto — proyecto de Ingeniería de Software, Universidad Tecmilenio. · <Link to="/catalogo">Catálogo</Link>
        </p>
        <p>Diego Villarreal Martínez · Al07064821</p>
      </div>
    </footer>
  );
}
