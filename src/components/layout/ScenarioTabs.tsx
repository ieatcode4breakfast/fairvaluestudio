import React from 'react';
import { PlusIcon } from '../Icons';
import { Scenario } from '../../types';
import { MAX_SCENARIOS } from '../../utils/constants';

interface ScenarioTabsProps {
  scenarios: Scenario[];
  activeScenarioId: number;
  setActiveScenarioId: (id: number) => void;
  draggedTabIndex: number | null;
  dragOverIndex: number | null;
  dropSuccessIndex: number | null;
  handleDragStart: (e: React.DragEvent<HTMLButtonElement>, index: number) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>, container: HTMLDivElement | null) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragEnd: () => void;
  addScenario: () => void;
  duplicateScenario: (id: number) => void;

  tabsContainerRef: React.RefObject<HTMLDivElement>;

}

export function ScenarioTabs(props: ScenarioTabsProps) {
  return (
    <div className="flex items-end justify-between gap-3">
      {/* Left: scenario tabs + add button */}
      <div className="flex flex-col gap-2">
        <div className="text-sm font-semibold text-slate-700 px-1">Scenarios</div>
        <div
          ref={props.tabsContainerRef}
          className="flex flex-wrap items-center gap-2 pb-1 min-w-0"
        >
          {props.scenarios.map((sc, index) => {
            const isActive = sc.id === props.activeScenarioId;
            const isDragged = props.draggedTabIndex === index;
            const isDropSuccess = props.dropSuccessIndex === index;
            const tooltipText = sc.scenarioName ? sc.scenarioName : "Untitled";

            let shiftClass = "";
            if (props.draggedTabIndex !== null && props.dragOverIndex !== null && !isDragged) {
              if (index >= props.dragOverIndex && index < props.draggedTabIndex) shiftClass = "translate-x-4";
              if (index <= props.dragOverIndex && index > props.draggedTabIndex) shiftClass = "-translate-x-4";
            }

            return (
              <button
                key={sc.id}
                data-tab-index={String(index)}
                title={tooltipText}
                draggable
                onDragStart={(e) => props.handleDragStart(e, index)}
                onDragEnd={props.handleDragEnd}
                onClick={() => props.setActiveScenarioId(sc.id)}
                className={`flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-xl text-sm font-medium transition-all duration-200 border cursor-grab active:cursor-grabbing ${shiftClass} ${isActive
                  ? 'bg-white text-indigo-600 border-indigo-200 shadow-sm'
                  : 'bg-slate-200/60 text-slate-500 border-transparent hover:bg-white hover:text-slate-700 hover:border-slate-200'
                  } ${isDragged ? 'opacity-20 scale-75 border-dashed border-indigo-300' : 'opacity-100'} ${isDropSuccess ? 'bg-green-100 border-green-300 text-green-700 shadow-md scale-110' : ''}`}
              >
                {index + 1}
              </button>
            );
          })}

          {props.scenarios.length < MAX_SCENARIOS && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative group">
                <button
                  onClick={props.addScenario}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-200/60 hover:bg-white hover:border-slate-200 border border-transparent text-slate-400 hover:text-indigo-600 transition-all"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                  Add Scenario
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
