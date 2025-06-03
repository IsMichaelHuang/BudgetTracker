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
  const params = useParams();

  const userId = params.userId;
  const username = params.username;

  const categoryId = params.catId;
  const categoryName = params.category;

  if (!categoryId) throw new Error(`Cannot find ${categoryName}`)

  // Filter the charges from category id and return the correct objects
  const category: CategoryType | undefined = summaryData.categories.find((cat) => cat._id === categoryId);
  if (!category) throw new Error("Error: Cannot find Category");

  const charges: ChargeType[] = summaryData.charges;
  const categoryCharges: ChargeType[] = charges.filter((cat) => cat.categoryId === categoryId);

  return (
    <main className="main-page">
      <h1>{categoryName}</h1>
      <CircularProgress value={category.amount} allotment={category.allotment} />
      <Link to={`/${username}/${userId}/${categoryId}`} >
        <button>edit</button> 
      </Link>

      <div className="spending-list">
        {categoryCharges.map(ch => (
          <Link key={ch._id} to={`/${username}/${userId}/${categoryName}/${categoryId}/${ch._id}`} > 
            <div className="tab">
              <p className="title">{ch.description}</p>
              <div>
                <p className="date">{ch.date}</p>
                <p className="amount">{ch.amount}</p>
              </div>
            </div>
          </Link>
        ))}
        <Link 
          to={`/${username}/${userId}/${categoryName}/${categoryId}/new`} 
        > 
          <div className="tab"><p className="title">+ Add New Charge</p></div>
          
        </Link>
      </div>
    </main>
  );
}
export default CategoryPage;

