import React from 'react';
import { Check, InfoIcon } from '../Icons';
import { ValuationMetadata, User } from '../../types';

export function DownloadModal({ show, setShow, filename, setFilename, onDownload }: any) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
        <h3 className="text-lg font-medium text-slate-900 mb-2">Download Valuation</h3>
        <p className="text-sm text-slate-500 mb-4">Enter a name for your valuation file:</p>
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm mb-6"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onDownload();
            if (e.key === 'Escape') setShow(false);
          }}
        />
        <div className="flex justify-end gap-3">
          <button onClick={() => setShow(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
          <button onClick={onDownload} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Save</button>
        </div>
      </div>
    </div>
  );
}

export function UploadModal({ show, setShow, currentUser, onProceed }: any) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
        <h3 className="text-lg font-medium text-slate-900 mb-2">Upload Valuation</h3>
        <p className="text-sm text-slate-500 mb-6">
          {currentUser
            ? 'This will create a new valuation. Do you want to proceed?'
            : 'Uploading a valuation will replace all your current scenarios. Any unsaved changes will be lost. Do you want to proceed?'
          }
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShow(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
          <button
            onClick={() => {
              setShow(false);
              onProceed();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${currentUser ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-600 hover:bg-red-700'
              }`}
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}

export function SaveAsModal({ show, setShow, name, setName, onSave }: any) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
        <h3 className="text-lg font-medium text-slate-900 mb-2">Save As New Valuation</h3>
        <p className="text-sm text-slate-500 mb-4">Enter a name for the new valuation:</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm mb-6"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') setShow(false);
          }}
        />
        <div className="flex justify-end gap-3">
          <button onClick={() => setShow(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Save</button>
        </div>
      </div>
    </div>
  );
}

export function NewValuationModal({ show, setShow, name, setName, isSaving, userValuations, onCreateClick }: any) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Create New Valuation</h3>
        {userValuations.length === 0 && (
          <p className="text-sm text-slate-500 mb-4">You have no saved valuations, enter the name for your first valuation:</p>
        )}
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm mb-6"
          placeholder="e.g. My Next Pick"
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter' && name.trim() && !isSaving) {
              onCreateClick(false);
            }
          }}
        />
        <div className="flex flex-col gap-3">
          {userValuations.length === 0 ? (
            <>
              <button
                onClick={() => onCreateClick(true)}
                disabled={!name.trim() || isSaving}
                className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSaving ? 'Creating...' : 'Load Sample Valuation'}
              </button>
              <button
                onClick={() => onCreateClick(false)}
                disabled={!name.trim() || isSaving}
                className="w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Create Blank
              </button>
            </>
          ) : (
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setShow(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onCreateClick(false)}
                disabled={!name.trim() || isSaving}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSaving ? 'Creating...' : 'Create'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DeleteModal({ show, setShow, onDelete }: any) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
        <h3 className="text-lg font-medium text-slate-900 mb-2">Delete Valuation?</h3>
        <p className="text-sm text-slate-500 mb-6">
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShow(false)}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function RenameModal({ show, setShow, name, setName, onRename }: any) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
        <h3 className="text-lg font-medium text-slate-900 mb-2">Rename Valuation</h3>
        <p className="text-sm text-slate-500 mb-4">Enter the new name for your valuation:</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm mb-6"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRename();
            if (e.key === 'Escape') setShow(false);
          }}
        />
        <div className="flex justify-end gap-3">
          <button onClick={() => setShow(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
          <button onClick={onRename} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Rename</button>
        </div>
      </div>
    </div>
  );
}

export function GenericConfirmModal({ show, setShow, title, description, confirmText, confirmClass, onConfirm }: any) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
        <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShow(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
          <button
            onClick={() => { setShow(false); onConfirm(); }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SaveSuccessModal({ show, name }: any) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm pointer-events-auto">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 text-center mx-auto pointer-events-auto">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Saved!</h3>
        <p className="text-sm text-slate-500">Successfully saved {name}.</p>
      </div>
    </div>
  );
}

export function SignupSuccessModal({ show }: any) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Success!</h3>
          <p className="text-sm text-slate-600">Your account has been created.</p>
        </div>
      </div>
    </div>
  );
}

export function RetainGuestModal({ show, name, setName, isSaving, onRetain }: any) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
        <h3 className="text-lg font-medium text-slate-900 mb-2">Save your current work?</h3>
        <p className="text-sm text-slate-500 mb-5">
          You have valuation data from your pre-login session. Give it a name to save it to your account, or discard and proceed with the login.
        </p>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Valuation name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) onRetain(true);
            if (e.key === 'Escape') onRetain(false);
          }}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm mb-6"
          autoFocus
        />
        <div className="flex justify-between gap-3">
          <button
            onClick={() => onRetain(false)}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={() => onRetain(true)}
            disabled={!name.trim() || isSaving}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
