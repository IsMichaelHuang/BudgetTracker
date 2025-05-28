import '../css/net-worth.css';

import { Link } from 'react-router-dom';

function NetWorthPage() {
  const placeholderCount = 4;

  return (
    <main className="main-page">
      <div className="net-worth-grid">
        {Array.from({ length: placeholderCount }).map((_, idx) => (
          <Link key={idx} to="net-worth-form">
            <h2>Placeholder</h2>
            <div>
              <img src="" alt="Charts" />
              <p>x.xx</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default NetWorthPage;



