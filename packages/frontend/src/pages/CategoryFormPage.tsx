import { useState } from 'react';
import { useParams } from 'react-router';

import type { ChargeType } from '../types/chargeType';
import type { CategoryType } from '../types/categoryType';
import type { SummaryType } from '../types/summaryType';


interface CategoryFormProp {
  summaryData: SummaryType
}

function CategoryFormPage({ summaryData }: CategoryFormProp) {
  const params = useParams();

  const chargeId = params.id;
  const categoryTitle = params.name;
  if (!categoryTitle) throw new Error("Error: Cannot find category title");

  const charge: ChargeType | undefined = summaryData.charges.find((ch) => ch._id === chargeId);
  const categoryList: CategoryType[] = summaryData.categories;

  const [category, setCategory] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<number>(0.00);
  const [_newCharge, _setNewCharge] = useState<boolean>(false); 

  // Edit existing charge
  if (chargeId) { 
    if (charge) {
      setCategory(categoryTitle);
      setDate(charge.date);
      setDescription(charge.description);
      setAmount(charge.amount);
    } else throw new Error("Error: selected charge DNE");
  } 

  function handleSubmit() {
    console.log("Hello World");
  }

  return (
    <main className="spending-list">
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="spending-category">Select Category</label>
          <select
            id="spending-category"
            name="spending-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="" disabled hidden>-</option>
            {categoryList.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.title}
              </option>
            ))}
          </select>
        </div> 
        <div>
          <label htmlFor="charge-name" className="visually-hidden">Charge Name:</label>
          <input
            type="text"
            id="charge-name"
            name="charge-name"
            placeholder="Charge Name"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="amount" className="visually-hidden">Amount ($):</label>
          <input
            type="number"
            id="amount"
            name="amount"
            placeholder="0.00"
            required
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="date">Enter Date:</label>
          <input
            type="date"
            id="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <button type="submit">Submit</button>
      </form>
    </main>
  );
}
export default CategoryFormPage;

