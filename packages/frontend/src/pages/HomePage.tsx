import { Link } from 'react-router-dom';

import '../css/link-tab-container.css';
import CircularProgress from '../components/CircularProgress';

// mock data
import { categories } from '../mock/mockCategories';


interface valueProps {
  totalAmount: number,
  totalAllotment: number
}

function HomePage({totalAmount, totalAllotment}: valueProps) {
  return (
    <main className="main-page">   
      <h1>Total Spent</h1>
      <CircularProgress value={totalAmount} allotment={totalAllotment} />

      <div className="spending-list">
        {categories.map(cat => (
          <Link 
            key={cat.id} 
            to={`/category/${cat.title}`}
            state={{ cat }}
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


