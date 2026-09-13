import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  FileText,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  ArrowRight,
  ListTodo,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Client, ClientRequest, ClientRequestStatus, Priority } from '../types';
import { formatDate, getRelativeDueDateLabel } from '../utils/formatters';

interface ClientsViewProps {
  onOpenQuickAdd: (defaultTab?: 'task' | 'project' | 'idea' | 'client') => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ onOpenQuickAdd }) => {
  const {
    data,
    searchQuery,
    updateClient,
    deleteClient,
    addClientRequest,
    updateClientRequest,
    deleteClientRequest,
    toggleClientRequestStatus,
    convertClientRequestToTask,
    setActiveTab,
  } = useWorkspace();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    data.clients.length > 0 ? data.clients[0].id : null
  );

  // New Request Form state
  const [showAddRequestModal, setShowAddRequestModal] = useState<string | null>(null);
  const [newRequestTitle, setNewRequestTitle] = useState('');
  const [newRequestDetails, setNewRequestDetails] = useState('');
  const [newRequestPriority, setNewRequestPriority] = useState<Priority>('high');
  const [newRequestDueDate, setNewRequestDueDate] = useState('');
  const [newRequestFee, setNewRequestFee] = useState('');
  const [newRequestHours, setNewRequestHours] = useState<string>('');

  // Edit Client state
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Filter clients
  const filteredClients = useMemo(() => {
    return data.clients.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesCompany = c.company.toLowerCase().includes(q);
        const matchesEmail = c.email.toLowerCase().includes(q);
        const matchesNotes = c.notes.toLowerCase().includes(q);
        const matchesRequest = c.requests.some(
          (r) => r.title.toLowerCase().includes(q) || r.details.toLowerCase().includes(q)
        );
        return matchesName || matchesCompany || matchesEmail || matchesNotes || matchesRequest;
      }
      return true;
    });
  }, [data.clients, searchQuery]);

  // Selected client object
  const activeClient = useMemo(() => {
    if (!selectedClientId && filteredClients.length > 0) {
      return filteredClients[0];
    }
    return data.clients.find((c) => c.id === selectedClientId) || filteredClients[0] || null;
  }, [data.clients, selectedClientId, filteredClients]);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddRequestModal || !newRequestTitle.trim()) return;

    addClientRequest(showAddRequestModal, {
      title: newRequestTitle.trim(),
      details: newRequestDetails.trim(),
      priority: newRequestPriority,
      status: 'pending',
      dueDate: newRequestDueDate || undefined,
      fee: newRequestFee.trim() || undefined,
      estimatedHours: newRequestHours ? parseFloat(newRequestHours) : undefined,
    });

    // Reset
    setShowAddRequestModal(null);
    setNewRequestTitle('');
    setNewRequestDetails('');
    setNewRequestPriority('high');
    setNewRequestDueDate('');
    setNewRequestFee('');
    setNewRequestHours('');
  };

  const handleSaveClientEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    updateClient(editingClient.id, {
      name: editingClient.name,
      company: editingClient.company,
      role: editingClient.role,
      email: editingClient.email,
      phone: editingClient.phone,
      website: editingClient.website,
      preferredCommunication: editingClient.preferredCommunication,
      notes: editingClient.notes,
      status: editingClient.status,
    });
    setEditingClient(null);
  };

  const totalDeliverablesCount = data.clients.reduce((acc, c) => acc + c.requests.length, 0);
  const pendingDeliverablesCount = data.clients.reduce(
    (acc, c) =>
      acc + c.requests.filter((r) => r.status === 'pending' || r.status === 'in_progress').length,
    0
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Important People & Clients
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Keep track of your clients, their contact information, and every deliverable they want you to do.
          </p>
        </div>
        <button
          id="clients-add-btn"
          onClick={() => onOpenQuickAdd('client')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-stone-500">Active Important People</div>
          <div className="text-2xl font-bold text-stone-900 mt-1">{data.clients.length}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Key partners & collaborators</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-stone-500">Pending Deliverables</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{pendingDeliverablesCount}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Awaiting completion or review</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-stone-500">Completed Deliverables</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {totalDeliverablesCount - pendingDeliverablesCount}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">Delivered or approved requests</div>
        </div>
      </div>

      {/* Client Directory & Details Master-Detail Layout */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200 rounded-xl">
          <Users className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-700">No clients found</h3>
          <p className="text-xs text-stone-400 mt-1">
            {searchQuery ? `No clients matching "${searchQuery}".` : 'Add your first client to get started.'}
          </p>
          <button
            onClick={() => onOpenQuickAdd('client')}
            className="mt-4 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition"
          >
            Add Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Client List (5 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 px-1">
              Client List ({filteredClients.length})
            </h3>

            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {filteredClients.map((client) => {
                const isSelected = activeClient?.id === client.id;
                const pendingCount = client.requests.filter(
                  (r) => r.status === 'pending' || r.status === 'in_progress'
                ).length;

                return (
                  <div
                    key={client.id}
                    id={`client-item-${client.id}`}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : 'bg-white border-stone-200 hover:border-stone-300 text-stone-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs"
                        style={{
                          backgroundColor: client.avatarColor || '#6366f1',
                          color: '#ffffff',
                        }}
                      >
                        {client.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-white' : 'text-stone-900'
                            }`}
                          >
                            {client.name}
                          </h4>
                          {pendingCount > 0 && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {pendingCount} todo
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-[11px] truncate ${
                            isSelected ? 'text-stone-300' : 'text-stone-500'
                          }`}
                        >
                          {client.company}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Client Details & Things They Want Me To Do (8 cols) */}
          {activeClient && (
            <div className="lg:col-span-8 space-y-6">
              {/* Client Profile Card */}
              <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-sm shrink-0"
                      style={{ backgroundColor: activeClient.avatarColor || '#6366f1' }}
                    >
                      {activeClient.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-stone-900 tracking-tight">
                          {activeClient.name}
                        </h3>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            activeClient.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : activeClient.status === 'lead'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {activeClient.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 font-medium">
                        {activeClient.role ? `${activeClient.role} at ` : ''}
                        <span className="text-stone-900 font-semibold">{activeClient.company}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-start">
                    <button
                      onClick={() => setEditingClient(activeClient)}
                      className="px-2.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg hover:bg-stone-50 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteClient(activeClient.id);
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="Delete Client"
                      aria-label={`Delete client ${activeClient.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-xs">
                  <div className="flex items-center gap-2.5 text-stone-700">
                    <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                    <a
                      href={`mailto:${activeClient.email}`}
                      className="text-indigo-600 hover:underline font-medium truncate"
                    >
                      {activeClient.email}
                    </a>
                  </div>

                  {activeClient.phone && (
                    <div className="flex items-center gap-2.5 text-stone-700">
                      <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                      <a
                        href={`tel:${activeClient.phone}`}
                        className="text-stone-800 hover:text-indigo-600 font-medium"
                      >
                        {activeClient.phone}
                      </a>
                    </div>
                  )}

                  {activeClient.website && (
                    <div className="flex items-center gap-2.5 text-stone-700">
                      <Globe className="w-4 h-4 text-stone-400 shrink-0" />
                      <a
                        href={activeClient.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-stone-600 hover:underline truncate flex items-center gap-1"
                      >
                        {activeClient.website.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3 text-stone-400" />
                      </a>
                    </div>
                  )}

                  {activeClient.preferredCommunication && (
                    <div className="flex items-center gap-2.5 text-stone-700">
                      <MessageSquare className="w-4 h-4 text-stone-400 shrink-0" />
                      <span className="text-stone-600 truncate">
                        Prefers: {activeClient.preferredCommunication}
                      </span>
                    </div>
                  )}
                </div>

                {/* Relationship Notes */}
                {activeClient.notes && (
                  <div className="mt-4 p-3 bg-stone-50 rounded-lg border border-stone-100 text-xs text-stone-600 leading-relaxed">
                    <span className="font-semibold text-stone-800">Client Context & Notes: </span>
                    {activeClient.notes}
                  </div>
                )}
              </div>

              {/* The Things They Want Me To Do (Deliverables & Requests) */}
              <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-indigo-600" />
                      Things {activeClient.name} Wants Me To Do ({activeClient.requests.length})
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Deliverables, feature requests, review items, and commitments for this client.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddRequestModal(activeClient.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Request
                  </button>
                </div>

                {/* Requests List */}
                {activeClient.requests.length === 0 ? (
                  <div className="text-center py-10 bg-stone-50 rounded-lg border border-dashed border-stone-200">
                    <ListTodo className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-xs text-stone-500 font-medium">
                      No deliverables or requests recorded yet for {activeClient.name}.
                    </p>
                    <button
                      onClick={() => setShowAddRequestModal(activeClient.id)}
                      className="mt-3 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                    >
                      Record first client request
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeClient.requests.map((request) => {
                      const isCompleted =
                        request.status === 'delivered' || request.status === 'approved';
                      const relativeDate = getRelativeDueDateLabel(request.dueDate);

                      return (
                        <div
                          key={request.id}
                          id={`client-request-${request.id}`}
                          className={`border rounded-xl p-4 transition-all ${
                            isCompleted
                              ? 'bg-stone-50/60 border-stone-200'
                              : 'bg-white border-stone-200 hover:border-indigo-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-sm font-semibold ${
                                    isCompleted ? 'line-through text-stone-400' : 'text-stone-900'
                                  }`}
                                >
                                  {request.title}
                                </span>

                                {/* Status Chip button */}
                                <button
                                  onClick={() =>
                                    toggleClientRequestStatus(activeClient.id, request.id)
                                  }
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider transition cursor-pointer ${
                                    request.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : request.status === 'delivered'
                                      ? 'bg-blue-100 text-blue-800'
                                      : request.status === 'in_progress'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-stone-100 text-stone-700'
                                  }`}
                                  title="Click to cycle status: Pending -> In Progress -> Delivered -> Approved"
                                >
                                  {request.status.replace('_', ' ')} ↺
                                </button>

                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm uppercase ${
                                    request.priority === 'urgent'
                                      ? 'bg-rose-100 text-rose-700'
                                      : request.priority === 'high'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-stone-100 text-stone-600'
                                  }`}
                                >
                                  {request.priority}
                                </span>
                              </div>

                              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                                {request.details}
                              </p>

                              {/* Metadata Strip */}
                              <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-3 flex-wrap">
                                {request.dueDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                                    <span
                                      className={
                                        relativeDate.isOverdue
                                          ? 'text-rose-600 font-bold'
                                          : 'text-stone-600 font-medium'
                                      }
                                    >
                                      Due {formatDate(request.dueDate)} ({relativeDate.label})
                                    </span>
                                  </div>
                                )}

                                {request.fee && (
                                  <div className="flex items-center gap-1 font-semibold text-emerald-700">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    <span>{request.fee}</span>
                                  </div>
                                )}

                                {request.estimatedHours && (
                                  <div className="flex items-center gap-1 text-stone-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>~{request.estimatedHours} hrs</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions column */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <button
                                onClick={() =>
                                  deleteClientRequest(activeClient.id, request.id)
                                }
                                className="p-1 text-stone-300 hover:text-rose-600 rounded transition"
                                title="Delete request"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {!request.linkedTaskId ? (
                                <button
                                  onClick={() => {
                                    convertClientRequestToTask(activeClient.id, request.id);
                                  }}
                                  className="text-[11px] font-medium text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer"
                                  title="Add this to your daily Things To Do workspace with a reminder"
                                >
                                  <span>+ Convert to Task</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-stone-400 font-medium bg-stone-100 px-2 py-0.5 rounded">
                                  ✓ In Things To Do
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Client Request Modal */}
      {showAddRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              New Client Request / Deliverable
            </h3>
            <p className="text-xs text-stone-500">
              Save what {activeClient?.name} wants you to build, prepare, or deliver.
            </p>

            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Deliverable / Request Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design review presentation, Pitch deck revisions..."
                  value={newRequestTitle}
                  onChange={(e) => setNewRequestTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Details & Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="Specific client instructions, criteria, notes..."
                  value={newRequestDetails}
                  onChange={(e) => setNewRequestDetails(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newRequestPriority}
                    onChange={(e) => setNewRequestPriority(e.target.value as Priority)}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  >
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🔵 Medium</option>
                    <option value="low">⚪ Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newRequestDueDate}
                    onChange={(e) => setNewRequestDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Agreed Fee / Budget
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $1,500 or Included"
                    value={newRequestFee}
                    onChange={(e) => setNewRequestFee(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 6"
                    value={newRequestHours}
                    onChange={(e) => setNewRequestHours(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddRequestModal(null)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                >
                  Save Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Profile Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-stone-900">Edit Client Profile</h3>
            <form onSubmit={handleSaveClientEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Company / Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingClient.company}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, company: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    value={editingClient.role || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, role: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingClient.email}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editingClient.phone || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={editingClient.website || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, website: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Communication Preference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Email, WhatsApp, Slack"
                    value={editingClient.preferredCommunication || ''}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        preferredCommunication: e.target.value,
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Relationship Notes & Context
                </label>
                <textarea
                  rows={3}
                  value={editingClient.notes}
                  onChange={(e) => setEditingClient({ ...editingClient, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
