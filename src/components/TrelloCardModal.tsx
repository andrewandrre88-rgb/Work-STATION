import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  Calendar,
  Clock,
  Tag,
  Trash2,
  CheckCircle2,
  Circle,
  Plus,
  ArrowRight,
  FolderKanban,
  Users,
  AlignLeft,
  Image as ImageIcon,
  Upload,
  Link,
  Sparkles,
  Maximize2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { TrelloCard, TrelloList, TrelloCardImage } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatDate } from '../utils/formatters';

interface TrelloCardModalProps {
  card: TrelloCard;
  isOpen: boolean;
  onClose: () => void;
  lists: TrelloList[];
}

const PRESET_COLORS = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Cyan', value: '#06b6d4' },
];

const CURATED_COVERS = [
  { title: 'Workspace', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80' },
  { title: 'Design Studio', url: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80' },
  { title: 'Engineering', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80' },
  { title: 'Architecture', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80' },
  { title: 'Creative Art', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80' },
  { title: 'Sunrise Gradient', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80' },
];

export const TrelloCardModal: React.FC<TrelloCardModalProps> = ({
  card,
  isOpen,
  onClose,
  lists,
}) => {
  const {
    updateTrelloCard,
    deleteTrelloCard,
    toggleTrelloCardComplete,
    moveTrelloCard,
    data,
  } = useWorkspace();

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [color, setColor] = useState(card.color || '');
  const [labelName, setLabelName] = useState(card.labelName || '');
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [projectId, setProjectId] = useState(card.projectId || '');
  const [clientId, setClientId] = useState(card.clientId || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Image & Cover states
  const [coverImage, setCoverImage] = useState<string>(card.coverImage || '');
  const [images, setImages] = useState<TrelloCardImage[]>(card.images || []);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [viewingFullImage, setViewingFullImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentList = lists.find((l) => l.id === card.listId) || {
    id: card.listId,
    title: card.listId === 'inbox' ? 'Inbox' : 'Board List',
  };

  const handleSave = () => {
    updateTrelloCard(card.id, {
      title: title.trim() || card.title,
      description: description.trim() || undefined,
      hasDescription: !!description.trim(),
      color: color || undefined,
      labelName: labelName.trim() || undefined,
      dueDate: dueDate || undefined,
      projectId: projectId || undefined,
      clientId: clientId || undefined,
      coverImage: coverImage.trim() || undefined,
      images: images.length > 0 ? images : undefined,
      hasAttachment: !!coverImage || images.length > 0,
    });
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        if (!resultUrl) return;
        const newImg: TrelloCardImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          url: resultUrl,
          name: file.name,
          createdAt: new Date().toISOString(),
        };
        setImages((prev) => [...prev, newImg]);
        setCoverImage((prev) => prev || resultUrl);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleAddImageUrl = (urlToAdd?: string) => {
    const targetUrl = (urlToAdd || imageUrlInput).trim();
    if (!targetUrl) return;
    const newImg: TrelloCardImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url: targetUrl,
      name: `Photo ${images.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    setImages((prev) => [...prev, newImg]);
    if (!coverImage) {
      setCoverImage(targetUrl);
    }
    setImageUrlInput('');
  };

  const handleDeleteImage = (imgId: string, imgUrl: string) => {
    const nextImages = images.filter((img) => img.id !== imgId);
    setImages(nextImages);
    if (coverImage === imgUrl) {
      setCoverImage(nextImages.length > 0 ? nextImages[0].url : '');
    }
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;
    const newItem = {
      id: `chk_${Date.now()}`,
      title: newChecklistTitle.trim(),
      completed: false,
    };
    const updated = [...(card.checklists || []), newItem];
    updateTrelloCard(card.id, { checklists: updated });
    setNewChecklistTitle('');
  };

  const handleToggleChecklist = (itemId: string) => {
    const updated = (card.checklists || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateTrelloCard(card.id, { checklists: updated });
  };

  const handleDeleteChecklist = (itemId: string) => {
    const updated = (card.checklists || []).filter((item) => item.id !== itemId);
    updateTrelloCard(card.id, { checklists: updated });
  };

  const checklists = card.checklists || [];
  const completedChecklists = checklists.filter((c) => c.completed).length;
  const progressPct =
    checklists.length > 0 ? Math.round((completedChecklists / checklists.length) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col my-auto border border-stone-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card Cover Header (If set) */}
        {coverImage ? (
          <div className="relative w-full h-44 sm:h-52 bg-stone-900 group overflow-hidden shrink-0">
            <img
              src={coverImage}
              alt="Card cover"
              className="w-full h-full object-cover opacity-95 group-hover:scale-102 transition duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewingFullImage(coverImage)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-xs flex items-center gap-1 transition cursor-pointer"
                title="View full size"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full view</span>
              </button>
              <button
                type="button"
                onClick={() => setCoverImage('')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-rose-600/85 hover:bg-rose-700 text-white rounded-lg backdrop-blur-xs flex items-center gap-1 transition cursor-pointer"
                title="Remove cover"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove Cover</span>
              </button>
            </div>
          </div>
        ) : color ? (
          <div
            className="h-4 w-full shrink-0"
            style={{ backgroundColor: color }}
          />
        ) : null}

        {/* Modal Header */}
        <div className="p-5 pb-3 border-b border-stone-100 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => toggleTrelloCardComplete(card.id)}
                className="text-stone-400 hover:text-emerald-600 transition cursor-pointer"
                title={card.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {card.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Card title..."
                className={`text-lg font-bold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-purple-600 focus:outline-none w-full px-1 py-0.5 rounded transition ${
                  card.completed ? 'line-through text-stone-400' : ''
                }`}
              />
            </div>
            <p className="text-xs text-stone-500 ml-7">
              in list <span className="font-semibold text-stone-700 underline">{currentList.title}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Quick Labels & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-3.5 rounded-xl border border-stone-200/70">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                Label & Color
              </label>
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(color === c.value ? '' : c.value)}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer flex items-center justify-center border ${
                      color === c.value ? 'scale-115 ring-2 ring-purple-600 ring-offset-1 border-white' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
              <input
                type="text"
                placeholder="Label name (e.g. High Impact, Marketing)..."
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-purple-600"
              />
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setDueDate(new Date().toISOString().split('T')[0])}
                  className="px-1.5 py-0.5 text-[10px] font-semibold bg-stone-200/80 hover:bg-purple-100 hover:text-purple-800 rounded transition cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    setDueDate(d.toISOString().split('T')[0]);
                  }}
                  className="px-1.5 py-0.5 text-[10px] font-semibold bg-stone-200/80 hover:bg-purple-100 hover:text-purple-800 rounded transition cursor-pointer"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 7);
                    setDueDate(d.toISOString().split('T')[0]);
                  }}
                  className="px-1.5 py-0.5 text-[10px] font-semibold bg-stone-200/80 hover:bg-purple-100 hover:text-purple-800 rounded transition cursor-pointer"
                >
                  +1 Week
                </button>
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate('')}
                    className="px-1.5 py-0.5 text-[10px] font-semibold text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              {dueDate && (
                <p className="text-[11px] text-stone-500 mt-1">
                  Due: <span className="font-medium text-stone-800">{formatDate(dueDate)}</span>
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-4 h-4 text-purple-600" />
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more detailed notes, requirements, links or specifications..."
              className="w-full text-xs p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
            />
          </div>

          {/* Photos & Cover Images Section */}
          <div className="bg-stone-50/90 p-4 rounded-xl border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                Photos & Cover Images ({images.length})
              </label>
              {coverImage && (
                <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Cover image set
                </span>
              )}
            </div>

            {/* Image Upload & Link Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* File upload input */}
              <label className="flex-1 px-3 py-2 bg-white hover:bg-purple-50/60 border border-stone-200 hover:border-purple-300 rounded-xl text-stone-700 font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs">
                <Upload className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Upload from computer</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* URL input */}
              <div className="flex-1 flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-2.5 py-1 shadow-2xs focus-within:border-purple-500">
                <Link className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <input
                  type="url"
                  placeholder="Paste web image URL..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  className="w-full text-xs bg-transparent focus:outline-none py-1"
                />
                <button
                  type="button"
                  disabled={!imageUrlInput.trim()}
                  onClick={() => handleAddImageUrl()}
                  className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold text-[11px] rounded-lg transition shrink-0 cursor-pointer"
                >
                  Attach
                </button>
              </div>
            </div>

            {/* Curated Quick Stock / Unsplash Covers */}
            <div className="pt-1">
              <p className="text-[11px] text-stone-500 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Instant curated covers:</span>
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {CURATED_COVERS.map((cov) => (
                  <button
                    key={cov.title}
                    type="button"
                    onClick={() => {
                      handleAddImageUrl(cov.url);
                      setCoverImage(cov.url);
                    }}
                    className={`relative h-14 rounded-lg overflow-hidden border transition group cursor-pointer ${
                      coverImage === cov.url
                        ? 'ring-2 ring-purple-600 border-purple-600 scale-102'
                        : 'border-stone-200 hover:border-purple-400'
                    }`}
                    title={`Use ${cov.title} cover`}
                  >
                    <img
                      src={cov.url}
                      alt={cov.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-1">
                      <span className="text-[9px] text-white font-medium truncate w-full text-center">
                        {cov.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Attached Images Grid */}
            {images.length > 0 && (
              <div className="pt-2 border-t border-stone-200/80">
                <p className="text-[11px] font-semibold text-stone-600 mb-2">
                  Attached Images ({images.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {images.map((img) => {
                    const isCover = coverImage === img.url;
                    return (
                      <div
                        key={img.id}
                        className={`relative rounded-xl overflow-hidden border bg-white group transition shadow-2xs ${
                          isCover
                            ? 'ring-2 ring-purple-600 border-purple-500'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="h-24 w-full overflow-hidden bg-stone-100 relative">
                          <img
                            src={img.url}
                            alt={img.name || 'Card image'}
                            className="w-full h-full object-cover group-hover:scale-105 transition cursor-pointer"
                            onClick={() => setViewingFullImage(img.url)}
                            referrerPolicy="no-referrer"
                          />
                          {isCover && (
                            <span className="absolute top-1.5 left-1.5 bg-purple-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" />
                              Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setViewingFullImage(img.url)}
                            className="absolute bottom-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            title="View full image"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="p-2 flex items-center justify-between gap-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setCoverImage(isCover ? '' : img.url)}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition cursor-pointer ${
                              isCover
                                ? 'bg-purple-100 text-purple-800'
                                : 'text-stone-600 hover:text-purple-700 hover:bg-stone-100'
                            }`}
                          >
                            {isCover ? 'Remove Cover' : 'Make Cover'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id, img.url)}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Delete image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Checklists */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-purple-600" />
                Checklist ({completedChecklists}/{checklists.length})
              </label>
              {checklists.length > 0 && (
                <span className="text-[11px] font-medium text-purple-700">
                  {progressPct}% completed
                </span>
              )}
            </div>

            {checklists.length > 0 && (
              <div className="w-full bg-stone-100 rounded-full h-1.5 mb-3 overflow-hidden">
                <div
                  className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}

            <div className="space-y-1.5 mb-2.5">
              {checklists.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-stone-50 border border-stone-100"
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklist(item.id)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                    />
                    <span
                      className={`text-xs truncate ${
                        item.completed ? 'line-through text-stone-400' : 'text-stone-800'
                      }`}
                    >
                      {item.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeleteChecklist(item.id)}
                    className="p-1 text-stone-300 hover:text-rose-500 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddChecklistItem} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add checklist item..."
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                className="flex-1 text-xs px-3 py-1.5 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-purple-600"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </form>
          </div>

          {/* Link to Client or Workspace Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-100">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1 flex items-center gap-1">
                <FolderKanban className="w-3 h-3 text-stone-400" />
                Link to Workspace Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
              >
                <option value="">No Project Link</option>
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-stone-400" />
                Link to Client
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
              >
                <option value="">No Client Link</option>
                {data.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Move to another list */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-stone-500 text-xs">Move to:</span>
              <select
                value={card.listId}
                onChange={(e) => {
                  moveTrelloCard(card.id, e.target.value);
                  onClose();
                }}
                className="text-xs px-2 py-1 bg-stone-100 border border-stone-200 rounded-lg font-medium text-stone-800"
              >
                <option value="inbox">📥 Inbox</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    📋 {l.title}
                  </option>
                ))}
              </select>
            </div>

            {confirmDelete ? (
              <div className="flex items-center gap-1.5 p-1 px-2 bg-rose-50 border border-rose-200 rounded-lg">
                <span className="text-[11px] font-bold text-rose-800">Delete card?</span>
                <button
                  type="button"
                  onClick={() => {
                    deleteTrelloCard(card.id);
                    onClose();
                  }}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold cursor-pointer transition"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-0.5 text-stone-600 hover:bg-stone-200 rounded text-[11px] cursor-pointer transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-rose-600 hover:text-rose-800 font-medium text-xs flex items-center gap-1 p-1 hover:bg-rose-50 rounded transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Card
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 rounded-xl hover:bg-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {viewingFullImage && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setViewingFullImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-stone-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-stone-950/80 flex items-center justify-between text-white border-b border-stone-800">
              <span className="text-xs font-semibold">Image Preview</span>
              <div className="flex items-center gap-2">
                <a
                  href={viewingFullImage}
                  target="_blank"
                  rel="noreferrer"
                  download="card-attachment"
                  className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
                  title="Open in new tab / download"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setViewingFullImage(null)}
                  className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-stone-950">
              <img
                src={viewingFullImage}
                alt="Full preview"
                className="max-h-[78vh] max-w-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
