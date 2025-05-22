import { Link } from 'react-router-dom';

import '../css/link-tab-container.css';
import CircularProgress from '../components/progress/CircularProgress';

// mock data
import { categories } from '../mock/mockCategories';
import { userData } from '../mock/mockUserData';


function HomePage() {
  return (
    <main className="main-page">   
      <CircularProgress value={userData.totalAmount} allotment={userData.totalAllotment} />

      <div className="spending-list">
        {categories.map(cat => (
          <Link 
            key={cat.id} 
            to="/category/${cat.id}"
            state={{ category: cat }}
          >
            <div className="tab">
              <p className="title">{cat.title}</p>
              <div>
                <p className="amount">{cat.amount}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </main>
  );
}

export default HomePage;


