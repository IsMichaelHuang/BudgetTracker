import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { formatToDate } from '../hooks/useFormatDate';

import type { ChargeType } from '../types/chargeType';
import type { CategoryType } from '../types/categoryType';
import type { SummaryType } from '../types/summaryType';

import { updateCharge, addCharge, deleteCharge } from '../api/charges';


interface ChargeFormProp {
  summaryData: SummaryType;
  refetch: () => void;
}

function ChargeFormPage({ summaryData, refetch }: ChargeFormProp) {
  const params = useParams();
  const userId: string | undefined = params.userId;
  const chargeId: string | undefined = params.chId;
  const categoryTitle: string | undefined = params.category;

  const charge: ChargeType | undefined = summaryData.charges.find((ch) => ch._id === chargeId);
  const categoryList: CategoryType[] = summaryData.categories;

  // Form state
  const [category, setCategory] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<number | undefined>(undefined);

  // From a Category
  useEffect(() => {
    if (categoryTitle) {
      setCategory(categoryTitle);
    }
  }, []);
  

  // Edit existing charge
  useEffect(() => {
    if (chargeId && charge) {
      setDate(formatToDate(charge.date));
      setDescription(charge.description);
      setAmount(charge.amount);
    }
  }, [chargeId, charge]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Get the Id from new category...
    const cat: CategoryType | undefined = categoryList.find(cat => cat.title == category);
    if (!cat) throw new Error("Error: Unable to find category from change") 
    const catId: string | undefined = cat._id;
    if (!catId) throw new Error(`Error: Category '${cat.title}' does not contain an object ID`); 
    if (!userId) throw new Error("Error: Unable to find User ID");
    if (!amount) throw new Error("Error: Need a valid amount")
    const data: ChargeType = {
      _id: chargeId,
      userId,
      categoryId: catId,
      description,
      amount,
      date
    };

    // Update existing Charge
    if (chargeId) {       
      await updateCharge(data);
    } else {
      // Create new charge
      await addCharge(data);
    }  
    window.history.back();
    refetch();
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault(); 

    if (!chargeId) throw new Error(`Error: Cannot delete Charge without an existing ID`);
    await deleteCharge(chargeId)

    window.history.back();
    refetch();
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
            <option value="" disabled>-</option>
            {categoryList.map((cat) => (
              <option key={cat._id} value={cat.title}>
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
            value={amount ?? ""}
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
        {chargeId && <button type="button" onClick={handleDelete}>Delete</button>}
        <button type="button" onClick={() => window.history.back()}>Cancel</button>
      </form>
    </main>
  );
}
export default ChargeFormPage;

