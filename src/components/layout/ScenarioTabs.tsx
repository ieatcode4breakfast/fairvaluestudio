import React, { useState } from 'react';
import { Reorder, AnimatePresence, motion } from 'motion/react';
import { PlusIcon, RotateCcw, List, Check, GripVertical } from '../Icons';
import { Scenario } from '../../types';
import { MAX_SCENARIOS } from '../../utils/constants';
import { SELECT_CLS } from '../../utils/constants';

interface ScenarioTabsProps {
  scenarios: Scenario[];
  activeScenarioId: number;
  setActiveScenarioId: (id: number) => void;
  onReorder: (newOrder: Scenario[]) => void;
  addScenario: () => void;
  onResetAll: () => void;
}

export function ScenarioTabs(props: ScenarioTabsProps) {
  const [isSorting, setIsSorting] = useState(false);
  const [tempOrder, setTempOrder] = useState<Scenario[]>([]);

  const handleToggleSorting = () => {
    if (isSorting) {
      // Apply the new order only on finish
      props.onReorder(tempOrder);
      setIsSorting(false);
    } else {
      // Initialize temp order when starting
      setTempOrder([...props.scenarios]);
      setIsSorting(true);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header: Label + Action Buttons Grouped Together */}
      <div className="flex items-center justify-start gap-4 px-1">
        <label htmlFor="scenario-select" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Scenarios
        </label>
        
        <div className="flex items-center gap-2">
          {props.scenarios.length < MAX_SCENARIOS && !isSorting && (
            <button
              onClick={props.addScenario}
              title="Add Scenario"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200/60 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 border border-transparent text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          )}

          {!isSorting && (
            <button
              onClick={props.onResetAll}
              title="Reset All Scenarios"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200/60 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 border border-transparent text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

        </div>
      </div>

      {/* Main Content Area: Dropdown/Reorder + Sort Button beside it */}
      <div className="flex items-start gap-2 max-w-[455px]">
        <div className="flex-1 relative min-h-[44px]">
          <AnimatePresence mode="wait">
            {!isSorting ? (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <select
                  id="scenario-select"
                  value={props.activeScenarioId}
                  onChange={(e) => props.setActiveScenarioId(Number(e.target.value))}
                  className={`${SELECT_CLS} !bg-white dark:!bg-slate-800 shadow-sm h-11 text-base font-medium`}
                >
                  {props.scenarios.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.scenarioName || 'Untitled'}
                    </option>
                  ))}
                </select>
              </motion.div>
            ) : (
              <motion.div
                key="reorder"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-0 left-0 w-full z-20 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="p-1">
                  <Reorder.Group
                    axis="y"
                    values={tempOrder}
                    onReorder={setTempOrder}
                    className="flex flex-col gap-1"
                  >
                    {tempOrder.map((sc) => (
                      <Reorder.Item
                        key={sc.id}
                        value={sc}
                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-grab active:cursor-grabbing transition-colors"
                      >
                        <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                          {sc.scenarioName || 'Untitled'}
                        </span>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleToggleSorting}
          title={isSorting ? "Finish Reordering" : "Reorder Scenarios"}
          className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-lg transition-all shadow-sm border ${
            isSorting 
              ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700' 
              : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 border-slate-200 dark:border-slate-700'
          }`}
        >
          {isSorting ? <Check className="w-5 h-5" /> : <List className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
