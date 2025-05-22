import { Link } from 'react-router-dom';

// import '../css/link-tab-container.css';
// import CircularProgress from '../components/progress/CircularProgress';


function CategoryPage() {
  const placeholderCount = 10; 

  // <CircularProgress value={userData.totalAmount} allotment={userData.totalAllotment} />

  return (
    <main className="main-page">

      <div className="spending-list">
        {Array.from({ length: placeholderCount }).map((_, idx) => (
          <Link key={idx} to="category-form">
            <div className="tab">
              <p className="title">Charge</p>
              <div>
                <p className="date">00/00/000</p>
                <p className="amount">x.xx</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default CategoryPage;


