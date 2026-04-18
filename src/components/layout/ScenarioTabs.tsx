import React, { useState } from 'react';
import { Reorder, AnimatePresence, motion, useDragControls } from 'motion/react';
import { PlusIcon, RotateCcw, List, Check, GripVertical, ChevronDown } from '../Icons';
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

interface ReorderItemProps {
  sc: Scenario;
  isActive: boolean;
  onSelect: () => void;
}

function ScenarioReorderItem({ sc, isActive, onSelect }: ReorderItemProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={sc}
      dragListener={false}
      dragControls={dragControls}
      className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
        isActive 
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' 
          : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
      }`}
    >
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="w-4 h-4 shrink-0" />
      </div>
      <div 
        onClick={onSelect}
        className={`flex-1 min-w-0 text-sm font-medium truncate select-none cursor-pointer transition-colors ${
          isActive 
            ? 'text-indigo-700 dark:text-indigo-300' 
            : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
        }`}
      >
        {sc.scenarioName || 'Untitled'}
      </div>
    </Reorder.Item>
  );
}

export function ScenarioTabs(props: ScenarioTabsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempOrder, setTempOrder] = useState<Scenario[]>([]);

  const activeScenario = props.scenarios.find(s => s.id === props.activeScenarioId);

  const handleOpen = () => {
    setTempOrder([...props.scenarios]);
    setIsOpen(true);
  };

  const handleClose = () => {
    props.onReorder(tempOrder);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header: Label + Action Buttons Grouped Together */}
      <div className="flex items-center justify-start gap-4 px-1">
        <label htmlFor="scenario-select" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Scenarios
        </label>

        <div className="flex items-center gap-2">
          {props.scenarios.length < MAX_SCENARIOS && !isOpen && (
            <button
              onClick={props.addScenario}
              title="Add Scenario"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200/60 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 border border-transparent text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          )}

          {!isOpen && (
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

      {/* Main Content Area: Pseudo-Dropdown Trigger or Reorder Overlay */}
      <div className="relative w-full max-w-[400px] sm:max-w-[315px] min-h-[38px]">
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              onClick={handleOpen}
              className={`${SELECT_CLS} !bg-white dark:!bg-slate-800 shadow-sm flex items-center cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors group`}
            >
              <span className="truncate text-slate-700 dark:text-slate-300">
                {activeScenario?.scenarioName || 'Untitled'}
              </span>
            </motion.div>
          ) : (
            <>
              {/* Backdrop to close and save */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="fixed inset-0 z-10 bg-transparent"
              />

              <motion.div
                key="reorder"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-0 left-0 w-full z-20 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="p-1">
                  <Reorder.Group
                    axis="y"
                    values={tempOrder}
                    onReorder={setTempOrder}
                    className="flex flex-col gap-1"
                  >
                    {tempOrder.map((sc) => (
                      <ScenarioReorderItem
                        key={sc.id}
                        sc={sc}
                        isActive={sc.id === props.activeScenarioId}
                        onSelect={() => {
                          props.setActiveScenarioId(sc.id);
                          props.onReorder(tempOrder);
                          setIsOpen(false);
                        }}
                      />
                    ))}
                  </Reorder.Group>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
