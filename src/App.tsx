import React, { useState, useRef } from 'react';
import { PlusCircle, X, Download, Share2, Moon, Sun } from 'lucide-react';
import { Participant, Expense, Settlement } from './types';
import { calculateSettlements, exportToPDF } from './utils';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const addParticipant = (name: string) => {
    if (name.trim() && participants.length < 6) {
      setParticipants([
        { id: crypto.randomUUID(), name: name.trim() },
        ...participants
      ]);
      setNewParticipantName('');
    }
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
    setExpenses(expenses.map(expense => ({
      ...expense,
      paidBy: expense.paidBy === id ? '' : expense.paidBy,
      participants: new Set([...expense.participants].filter(pid => pid !== id))
    })));
  };

  const addExpense = () => {
    setExpenses([
      {
        id: crypto.randomUUID(),
        name: '',
        amount: 0,
        paidBy: '',
        participants: new Set()
      },
      ...expenses
    ]);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(expenses.map(expense =>
      expense.id === id ? { ...expense, ...updates } : expense
    ));
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const toggleParticipantInExpense = (expenseId: string, participantId: string) => {
    setExpenses(expenses.map(expense => {
      if (expense.id === expenseId) {
        const newParticipants = new Set(expense.participants);
        if (newParticipants.has(participantId)) {
          newParticipants.delete(participantId);
        } else {
          newParticipants.add(participantId);
        }
        return { ...expense, participants: newParticipants };
      }
      return expense;
    }));
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const settlements = calculateSettlements(expenses, participants);

  return (
    <div id="pdf-export" className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Trip Expense Calculator</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Total Expenses */}
        <div className={`mb-8 p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-2xl font-semibold mb-2">Total Trip Expense</h2>
          <p className="text-4xl font-bold text-green-500">${totalExpenses.toFixed(2)}</p>
        </div>

        {/* Participants Section */}
        <div className={`mb-8 p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-xl font-semibold mb-4">Participants</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {participants.map(participant => (
              <div
                key={participant.id}
                className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              >
                <span>{participant.name}</span>
                <button
                  onClick={() => removeParticipant(participant.id)}
                  className="p-1 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {participants.length < 6 && (
            <div className="flex gap-2">
              <input
                ref={nameInputRef}
                type="text"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addParticipant(newParticipantName);
                  }
                }}
                placeholder="Enter participant name"
                className={`flex-1 px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              />
              <button
                onClick={() => addParticipant(newParticipantName)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Expenses Table */}
        <div className={`mb-8 p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg overflow-x-auto`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Expenses</h2>
            <button
              onClick={addExpense}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              Add Expense
            </button>
          </div>
          
          <table className="w-full min-w-max">
            <thead>
              <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <th className="px-4 py-2 text-left">Expense</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Paid By</th>
                {participants.map(p => (
                  <th key={p.id} className="px-4 py-2 text-center">{p.name}</th>
                ))}
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={expense.name}
                      onChange={(e) => updateExpense(expense.id, { name: e.target.value })}
                      className={`w-full px-2 py-1 rounded ${
                        darkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                      placeholder="Expense name"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={expense.amount || ''}
                      onChange={(e) => updateExpense(expense.id, { amount: Number(e.target.value) })}
                      className={`w-32 px-2 py-1 rounded ${
                        darkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={expense.paidBy}
                      onChange={(e) => updateExpense(expense.id, { paidBy: e.target.value })}
                      className={`w-full px-2 py-1 rounded ${
                        darkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <option value="">Select payer</option>
                      {participants.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  {participants.map(p => (
                    <td key={p.id} className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={expense.participants.has(p.id)}
                        onChange={() => toggleParticipantInExpense(expense.id, p.id)}
                        className="w-4 h-4"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    <button
                      onClick={() => removeExpense(expense.id)}
                      className="p-1 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Settlements */}
        {settlements.length > 0 && (
          <div className={`mb-8 p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Settlements</h2>
              <div className="flex gap-2">
                <button
                    onClick={exportToPDF} 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    <Download className="w-5 h-5" />
                    Export PDF
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {settlements.map((settlement, index) => {
                const from = participants.find(p => p.id === settlement.from);
                const to = participants.find(p => p.id === settlement.to);
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  >
                    <p className="text-lg">
                      <span className="font-semibold">{from?.name}</span> owes{' '}
                      <span className="font-semibold">{to?.name}</span>{' '}
                      <span className="text-green-500 font-bold">
                        ${settlement.amount.toFixed(2)}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;