import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { Charge } from '../mock/mockCharges';


function CategoryFormPage() {
  const location = useLocation(); 

  return (
    <main className="main-page">
      <form onSubmit={}>
        <div>
          <label htmlFor="spending-categories">Choose a category:</label>
          <select
            id="spending-categories"
            name="spending-categories"
            value={}
            onChange={}
            required
          >
            <option value="" disabled hidden>-</option>
            <option value="food">Food</option>
            <option value="gas">Gas</option>
            <option value="rent">Rent</option>
            <option value="water">Water</option>
          </select>
        </div>
        <div>
          <label htmlFor="date">Enter Date:</label>
          <input
            type="date"
            id="date"
            name="date"
            value={}
            onChange={}
            required
          />
        </div>
        <div>
          <label htmlFor="charge-name" className="visually-hidden">Charge Name:</label>
          <input
            type="text"
            id="charge-name"
            name="charge-name"
            placeholder="Charge Name"
            value={}
            onChange={}
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
            value={}
            onChange={}
          />
        </div>
        <button type="submit">Submit</button>
      </form>
    </main>
  );
}

export default CategoryFormPage;

