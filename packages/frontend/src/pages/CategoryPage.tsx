import { Link, useLocation } from 'react-router-dom';

// Circular Progress component
import '../css/link-tab-container.css';
import CircularProgress from '../components/CircularProgress';

// Mock data, remove later
import { charges } from '../mock/mockCharges';
import type { Charge } from '../mock/mockCharges';
import type { Category } from "../mock/mockCategories";

interface CategoryLinkState {
  cat: Category;
}

function CategoryPage() {
  const location = useLocation();
  const { cat } = (location.state as CategoryLinkState)!;

  // Filter the charges from category id and return the correct objects
  const categoryCharges: Charge[] = charges.filter(ch => ch.categoryId === cat.id); 

  return (
    <main className="main-page">
      <h1>{cat.title}</h1>

      <CircularProgress value={cat.amount} allotment={cat.allotment} />

      <div className="spending-list">
        {categoryCharges.map(ch => (
          <Link key={ch.id} 
            to={`category-form/${ch.id}`} 
            state={{
              title: cat.title,
              categoryCharges, 
              charge: ch
            }}
          > 
            <div className="tab">
              <p className="title">{ch.description}</p>
              <div>
                <p className="date">{ch.date}</p>
                <p className="amount">{ch.amount}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default CategoryPage;


