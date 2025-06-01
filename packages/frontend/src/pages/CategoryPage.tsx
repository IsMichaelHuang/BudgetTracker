import { Link, useLocation } from 'react-router-dom';

// Circular Progress component
import '../css/link-tab-container.css';
import CircularProgress from '../components/CircularProgress';
import type { ChargeType } from '../types/chargeType';
import type { CategoryType } from '../types/categoryType';
interface CategoryLinkState {
  userId: string;
  catId: string;
  charges: ChargeType[];
  cat: CategoryType;
}

function CategoryPage() {
  const location = useLocation();
  const { userId, catId, charges, cat } = (location.state as CategoryLinkState)!;

  if(!userId || !catId || !charges || !cat) {
    throw new Error("Missing one more more variables for CategoryPage")
  };

  // Filter the charges from category id and return the correct objects
  const categoryCharges: ChargeType[] = charges.filter(
    ch => ch.categoryId.toString() === catId && ch.userId.toString() === userId
  ); 

  return (
    <main className="main-page">
      <h1>{cat.title}</h1>

      <CircularProgress value={cat.amount} allotment={cat.allotment} />

      <div className="spending-list">
        {categoryCharges.map(ch => (
          <Link key={ch._id} 
            to={`category-form/${ch._id}`} 
            state={{
              title: cat.title,
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


