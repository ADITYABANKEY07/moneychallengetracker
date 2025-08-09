"use client";
import React, { useEffect, useState } from "react";

function Tracker() {
  const OPTIONS = [30, 60, 90];

  const defaultGoals = {
    30: 13000,
    60: 26000,
    90: 39000,
  };

  const [length, setLength] = useState(30);
  const [days, setDays] = useState([]);
  const [selected, setSelected] = useState(null);
  const [goals, setGoals] = useState(defaultGoals);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  // Use a single storage key for all challenges
  const storageKey = "work-challenge-all";
  const goalsKey = "work-challenge-goals";

  // Load days from a single storage key
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw && raw.trim() !== "") {
      try {
        const storedDays = JSON.parse(raw);
        setDays(storedDays);
      } catch (e) {
        console.error("Failed to parse stored challenge", e);
      }
    } else {
      // Initialize with a large array to accommodate all options
      const init = Array.from({ length: 90 }, (_, i) => ({
        day: i + 1,
        done: false,
        amount: 0,
      }));
      setDays(init);
    }
  }, []);

  // Save all days
  useEffect(() => {
    if (days.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(days));
    }
  }, [days]);

  // Load goals
  useEffect(() => {
    const savedGoals = localStorage.getItem(goalsKey);
    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals));
      } catch {
        setGoals(defaultGoals);
      }
    }
  }, []);

  // Save goals
  useEffect(() => {
    localStorage.setItem(goalsKey, JSON.stringify(goals));
  }, [goals]);

  const toggleDay = (i) => {
    setSelected({ index: i, amount: days[i].amount });
  };

  const saveDay = (index, done, amount) => {
    setDays((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], done, amount: Number(amount) || 0 };
      return copy;
    });
    setSelected(null);
  };

  const clearChallenge = () => {
    if (!confirm("Clear all progress for all challenges?")) return;
    const reset = Array.from({ length: 90 }, (_, i) => ({
      day: i + 1,
      done: false,
      amount: 0,
    }));
    setDays(reset);
  };

  // Only count totals for the current length
  const totals = days.slice(0, length).reduce(
    (acc, d) => {
      acc.total += Number(d.amount || 0);
      if (d.done) {
        acc.daysDone += 1;
        if (d.amount > 0) acc.wins += 1;
        if (d.amount < 0) acc.losses += 1;
      }
      return acc;
    },
    { total: 0, daysDone: 0, wins: 0, losses: 0 }
  );

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(days, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `challenge-all.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (Array.isArray(parsed) && parsed.length === 90) {
          setDays(parsed);
        } else {
          alert("Imported file must be for a 90-day challenge.");
        }
      } catch (err) {
        alert("Failed to import JSON");
      }
    };
    reader.readAsText(file);
  };

  const goal = goals[length] || 0;
  const goalProgress =
    goal > 0 ? Math.min((totals.total / goal) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white p-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">Money Challenge Tracker</h1>
            <p className="text-sm text-slate-600 mt-1">
              Track profits/losses for {length}-day challenges — saves to
              localStorage
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {OPTIONS.map((o) => (
              <button
                key={o}
                onClick={() => setLength(o)}
                className={`px-3 py-1 rounded-full border transition ${
                  length === o
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                {o} days
              </button>
            ))}

            <div className="ml-2 flex gap-2">
              <button
                onClick={exportJSON}
                className="px-3 py-1 border rounded-md text-sm"
              >
                Export
              </button>
              <label className="px-3 py-1 border rounded-md text-sm cursor-pointer">
                Import
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files && importJSON(e.target.files[0])
                  }
                />
              </label>
              <button
                onClick={clearChallenge}
                className="px-3 py-1 border rounded-md text-sm text-red-600"
              >
                Clear
              </button>
            </div>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold">Progress</h3>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                Target: <strong>₹{goal.toLocaleString()}</strong>
                <button
                  onClick={() => {
                    setGoalInput(goal);
                    setEditingGoal(true);
                  }}
                  className="text-xs text-blue-600 underline"
                >
                  Edit
                </button>
              </div>
              <div className="text-sm text-slate-600">
                Achieved:{" "}
                <strong>₹{totals.total.toLocaleString()}</strong> (
                {goalProgress.toFixed(1)}%)
              </div>
              <div className="text-sm text-slate-600">
                Days completed:{" "}
                <strong>
                  {totals.daysDone}/{length}
                </strong>
              </div>
              <div className="text-sm text-slate-600">
                Wins: <strong>{totals.wins}</strong> • Losses:{" "}
                <strong>{totals.losses}</strong>
              </div>

              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm col-span-1 md:col-span-2">
            <h3 className="font-semibold mb-2">Summary</h3>
            <div className="flex flex-wrap gap-3 text-sm text-slate-700">
              <div className="px-2 py-1 border rounded">
                Average per completed day:{" "}
                <strong>
                  {totals.daysDone
                    ? (totals.total / totals.daysDone).toFixed(2)
                    : "0.00"}
                </strong>
              </div>
              <div className="px-2 py-1 border rounded">
                Average per all days:{" "}
                <strong>{(totals.total / length).toFixed(2)}</strong>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              Tip: Click a day to mark it done and set the amount (positive for
              profit, negative for loss).
            </div>
          </div>
        </section>

        <main>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {days.slice(0, length).map((d, i) => (
              <button
                key={d.day}
                onClick={() => toggleDay(i)}
                className={`p-3 rounded-lg text-left border flex flex-col justify-between hover:shadow-md transition ${
                  d.done
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Day {d.day}</div>
                  <div className="text-xs text-slate-500">
                    {d.done ? "Done" : "Open"}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-sm">Amount</div>
                  <div
                    className={`mt-1 font-semibold ${
                      d.amount < 0 ? "text-red-600" : "text-slate-800"
                    }`}
                  >
                    ₹{d.amount}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </main>

        {/* Day Modal */}
        {selected !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSelected(null)}
            />
            <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md z-10">
              <h3 className="text-lg font-bold mb-2">
                Update Day {days[selected.index].day}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-600">
                    Amount (use negative for loss)
                  </label>
                  <input
                    type="number"
                    value={selected.amount}
                    onChange={(e) =>
                      setSelected((s) => ({ ...s, amount: e.target.value }))
                    }
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      saveDay(selected.index, true, selected.amount)
                    }
                    className="px-4 py-2 rounded bg-emerald-600 text-white"
                  >
                    Mark Done & Save
                  </button>

                  <button
                    onClick={() => saveDay(selected.index, false, 0)}
                    className="px-4 py-2 rounded border"
                  >
                    Mark Not Done
                  </button>

                  <button
                    onClick={() => setSelected(null)}
                    className="ml-auto text-sm text-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Goal Edit Modal */}
        {editingGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setEditingGoal(false)}
            />
            <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md z-10">
              <h3 className="text-lg font-bold mb-4">Edit Target</h3>
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setEditingGoal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setGoals((prev) => ({
                      ...prev,
                      [length]: Number(goalInput) || 0,
                    }));
                    setEditingGoal(false);
                  }}
                  className="px-4 py-2 rounded bg-emerald-600 text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-8 text-center text-sm text-slate-500">
          Made with ♡ — saves locally in your browser (localStorage)
        </footer>
      </div>
    </div>
  );
}

export default Tracker;