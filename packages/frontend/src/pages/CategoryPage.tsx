import { Link, useParams, useLocation } from 'react-router-dom';

// Categories mock data
import { categories } from '../mock/mockCategories';
import type { Category } from '../mock/mockCategories';

// Charges
import { charges } from '../mock/mockCharges';
import type { Charge } from '../mock/mockCharges';

// Circular Progress component
import '../css/link-tab-container.css';
import CircularProgress from '../components/CircularProgress';


function CategoryPage() {
  // Grad the id param e.g. the dynamic URL segment (in case I need it)
  const { id } = useParams<{ id: string }>();
  const catId = Number(id);

  const location = useLocation();
  const stateCat = (location.state as { category?: Category })?.category; // match the id with the correct category object

  const category = stateCat ?? categories.find(c => c.id === catId);
  if(!category) {
    return <p>Category not found...</p>
  }

  // Filter the charges from category id and return the correct objects
  const categoryCharges: Charge[] = charges.filter(
    ch => ch.categoryId === category.id
  );

  return (
    <main className="main-page">
      <h1>{category.title}</h1>

      <CircularProgress value={category.amount} allotment={category.allotment} />

      <div className="spending-list">
        {categoryCharges.map(ch => (
          <Link key={ch.id} 
            to={`category-form/${ch.id}`} 
            state={{
              title: category.title,
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


