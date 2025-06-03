import { useParams } from "react-router";
import { Link } from 'react-router-dom';

// Circular Progress component
import '../css/link-tab-container.css';
import CircularProgress from '../components/CircularProgress';
import type { SummaryType } from "../types/summaryType";
import type { ChargeType } from '../types/chargeType';
import type { CategoryType } from '../types/categoryType';


interface CategoryProp {
  summaryData: SummaryType;
}

function CategoryPage({ summaryData }: CategoryProp) {
  const categoryParams = useParams();
  const categoryId = categoryParams.id;
  if (!categoryId) throw new Error(`Cannot find ${categoryParams.name}`)

  // Filter the charges from category id and return the correct objects
  const category: CategoryType | undefined = summaryData.categories.find((cat) => cat._id === categoryId);
  if (!category) throw new Error("Error: Cannot find Category");

  const charges: ChargeType[] = summaryData.charges;
  const categoryCharges: ChargeType[] = charges.filter((cat) => cat.categoryId === categoryId);

  return (
    <main className="main-page">
      <h1>{category.title}</h1>
      <CircularProgress value={category.amount} allotment={category.allotment} />

      <div className="spending-list">
        {categoryCharges.map(ch => (
          <Link key={ch._id} to={`/${category.title}/${ch._id}`} > 
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

