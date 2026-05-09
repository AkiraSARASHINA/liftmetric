import BottomNav from './BottomNav';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <header className="header glass">
        <h1 className="logo">Lift<span>Metric</span></h1>
      </header>
      <main className="content">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
