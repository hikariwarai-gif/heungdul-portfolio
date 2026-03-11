import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Upload, Trash2, Edit2, Image as ImageIcon, ArrowRight, Play, ExternalLink, Download, Database } from 'lucide-react';

// Utility to get YouTube ID and Thumbnail
const getYoutubeInfo = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    const videoId = match[2];
    return {
      videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`
    };
  }
  return null;
};

interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  image_url: string;
  image_url_2?: string;
  image_url_3?: string;
  image_url_4?: string;
  image_url_5?: string;
  thumbnail_url: string;
  created_at: string;
}

export default function App() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [newImage2, setNewImage2] = useState<string | null>(null);
  const [newImage3, setNewImage3] = useState<string | null>(null);
  const [newImage4, setNewImage4] = useState<string | null>(null);
  const [newImage5, setNewImage5] = useState<string | null>(null);
  const [newThumbnail, setNewThumbnail] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const fileInputRef3 = useRef<HTMLInputElement>(null);
  const fileInputRef4 = useRef<HTMLInputElement>(null);
  const fileInputRef5 = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'thumb' | 'img2' | 'img3' | 'img4' | 'img5') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'main') setNewImage(result);
        else if (type === 'thumb') setNewThumbnail(result);
        else if (type === 'img2') setNewImage2(result);
        else if (type === 'img3') setNewImage3(result);
        else if (type === 'img4') setNewImage4(result);
        else if (type === 'img5') setNewImage5(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (item: PortfolioItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setNewTitle(item.title);
    setNewDesc(item.description);
    setNewImage(item.image_url);
    setNewImage2(item.image_url_2 || null);
    setNewImage3(item.image_url_3 || null);
    setNewImage4(item.image_url_4 || null);
    setNewImage5(item.image_url_5 || null);
    setNewThumbnail(item.thumbnail_url);
    setIsUploadOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadOpen(false);
    setEditingItem(null);
    setNewTitle('');
    setNewDesc('');
    setNewImage(null);
    setNewImage2(null);
    setNewImage3(null);
    setNewImage4(null);
    setNewImage5(null);
    setNewThumbnail(null);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `portfolio_backup_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (!Array.isArray(importedData)) throw new Error('Invalid data format');

        if (confirm(`${importedData.length}개의 작품을 가져오시겠습니까? 기존 데이터는 유지됩니다.`)) {
          for (const item of importedData) {
            await fetch('/api/portfolio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: item.title,
                description: item.description,
                image_url: item.image_url,
                image_url_2: item.image_url_2,
                image_url_3: item.image_url_3,
                image_url_4: item.image_url_4,
                image_url_5: item.image_url_5,
                thumbnail_url: item.thumbnail_url,
              }),
            });
          }
          fetchItems();
          alert('성공적으로 가져왔습니다.');
        }
      } catch (err) {
        alert('파일을 읽는 중 오류가 발생했습니다. 올바른 백업 파일인지 확인해주세요.');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newImage) return;

    try {
      const url = editingItem ? `/api/portfolio/${editingItem.id}` : '/api/portfolio';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          image_url: newImage,
          image_url_2: newImage2,
          image_url_3: newImage3,
          image_url_4: newImage4,
          image_url_5: newImage5,
          thumbnail_url: newThumbnail || newImage,
        }),
      });

      if (res.ok) {
        closeUploadModal();
        fetchItems();
      }
    } catch (err) {
      console.error('Failed to save item:', err);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // confirm() can be blocked in iframes, using a simpler check or just proceeding
    // For better UX in this environment, we'll just proceed or you could implement a custom modal
    try {
      await fetch(`/api/portfolio/${id}`, { method: 'DELETE' });
      fetchItems();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  return (
    <div className="min-h-screen font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <h1 className="font-serif text-3xl font-light tracking-tight">
            서현희 <span className="italic">포트폴리오</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 mr-4 border-r border-black/10 pr-4">
              <button
                onClick={handleExport}
                className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-500 flex items-center gap-2 text-xs font-medium"
                title="데이터 백업 (내보내기)"
              >
                <Download size={18} />
                <span>백업</span>
              </button>
              <label className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-500 flex items-center gap-2 text-xs font-medium cursor-pointer" title="데이터 복구 (가져오기)">
                <Database size={18} />
                <span>복구</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1a1a1a] text-white rounded-full text-sm font-medium hover:bg-black transition-colors"
            >
              <Plus size={18} />
              작품 업로드
            </button>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedItem(item)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
                  {(() => {
                    const yt = getYoutubeInfo(item.thumbnail_url || item.image_url);
                    return (
                      <>
                        <img
                          src={yt ? yt.thumbnail : (item.thumbnail_url || item.image_url)}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        {yt && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                              <Play size={24} fill="white" />
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={(e) => handleEdit(item, e)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-6 flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-xl font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{item.description}</p>
                  </div>
                  <ArrowRight size={20} className="text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-full overflow-auto bg-white rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full hover:bg-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 items-start">
                <div className="bg-gray-50 border-r border-gray-100 space-y-4 p-4">
                  {[selectedItem.image_url, selectedItem.image_url_2, selectedItem.image_url_3, selectedItem.image_url_4, selectedItem.image_url_5]
                    .filter(Boolean)
                    .map((url, idx) => {
                      const yt = getYoutubeInfo(url!);
                      if (yt) {
                        return (
                          <div key={idx} className="relative aspect-video w-full rounded-lg overflow-hidden shadow-sm bg-black">
                            <iframe
                              src={yt.embedUrl}
                              className="absolute inset-0 w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        );
                      }
                      return (
                        <img
                          key={idx}
                          src={url}
                          alt={`${selectedItem.title} - ${idx + 1}`}
                          className="w-full h-auto rounded-lg shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      );
                    })}
                </div>
                <div className="p-8 lg:p-16 lg:sticky lg:top-0">
                  <div className="max-w-xl">
                    <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-6 block">Project Detail</span>
                    <h2 className="font-serif text-2xl lg:text-3xl font-medium mb-6 leading-tight">{selectedItem.title}</h2>
                    <div className="h-px w-12 bg-black/10 mb-8" />
                    <div className="text-gray-600 text-sm leading-relaxed mb-12 whitespace-pre-wrap">
                      {selectedItem.description.split(/(\s+)/).map((part, i) => {
                        if (part.match(/^https?:\/\/[^\s]+$/)) {
                          return (
                            <a
                              key={i}
                              href={part}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-500 hover:underline break-all"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {part}
                              <ExternalLink size={12} />
                            </a>
                          );
                        }
                        return part;
                      })}
                    </div>
                    <div className="pt-8 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Date</p>
                        <p className="text-sm font-medium">{new Date(selectedItem.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Artist</p>
                        <p className="text-sm font-medium">Seo Hyun-hee</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsUploadOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-medium">{editingItem ? '작품 수정' : '새 작품 업로드'}</h2>
                <button onClick={closeUploadModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">작품 제목</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="작품의 이름을 입력하세요"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">설명</label>
                  <textarea
                    rows={12}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="작품에 대한 설명을 상세히 입력하세요"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all resize-none min-h-[300px] text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-medium text-gray-500">목록용 썸네일</label>
                    <div
                      onClick={() => thumbInputRef.current?.click()}
                      className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden ${
                        newThumbnail ? 'border-transparent bg-gray-50' : 'border-gray-200 hover:border-black hover:bg-gray-50'
                      }`}
                    >
                      {newThumbnail ? (
                        <>
                          {(() => {
                            const yt = getYoutubeInfo(newThumbnail);
                            return (
                              <div className="relative w-full h-full">
                                <img src={yt ? yt.thumbnail : newThumbnail} className="w-full h-full object-cover" />
                                {yt && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Play size={20} fill="white" className="text-white" />
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNewThumbnail(null);
                                  }}
                                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black transition-colors z-20"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            );
                          })()}
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white text-[10px] font-medium">변경</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="text-gray-400" />
                          <p className="text-[9px] font-medium text-center px-2">썸네일</p>
                        </>
                      )}
                    </div>
                    <input
                      type="text"
                      value={newThumbnail || ''}
                      onChange={(e) => setNewThumbnail(e.target.value)}
                      placeholder="이미지 URL"
                      className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded-md outline-none focus:border-black"
                    />
                    <input type="file" ref={thumbInputRef} onChange={(e) => handleImageUpload(e, 'thumb')} accept="image/*" className="hidden" />
                  </div>

                  {[
                    { label: '메인 이미지', ref: fileInputRef, state: newImage, setState: setNewImage, type: 'main' as const },
                    { label: '추가 이미지 2', ref: fileInputRef2, state: newImage2, setState: setNewImage2, type: 'img2' as const },
                    { label: '추가 이미지 3', ref: fileInputRef3, state: newImage3, setState: setNewImage3, type: 'img3' as const },
                    { label: '추가 이미지 4', ref: fileInputRef4, state: newImage4, setState: setNewImage4, type: 'img4' as const },
                    { label: '추가 이미지 5', ref: fileInputRef5, state: newImage5, setState: setNewImage5, type: 'img5' as const },
                  ].map((slot, idx) => (
                    <div key={idx} className="space-y-3">
                      <label className="text-[11px] font-medium text-gray-500">{slot.label}</label>
                      <div
                        onClick={() => slot.ref.current?.click()}
                        className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden ${
                          slot.state ? 'border-transparent bg-gray-50' : 'border-gray-200 hover:border-black hover:bg-gray-50'
                        }`}
                      >
                        {slot.state ? (
                          <>
                            {(() => {
                              const yt = getYoutubeInfo(slot.state);
                              return (
                                <div className="relative w-full h-full">
                                  <img src={yt ? yt.thumbnail : slot.state} className="w-full h-full object-cover" />
                                  {yt && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Play size={20} fill="white" className="text-white" />
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      slot.setState(null);
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black transition-colors z-20"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              );
                            })()}
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                              <p className="text-white text-[10px] font-medium">변경</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload size={16} className="text-gray-400" />
                            <p className="text-[9px] font-medium text-center px-2">이미지 {idx + 1}</p>
                          </>
                        )}
                      </div>
                      <input
                        type="text"
                        value={slot.state || ''}
                        onChange={(e) => slot.setState(e.target.value)}
                        placeholder="이미지 URL"
                        className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded-md outline-none focus:border-black"
                      />
                      <input type="file" ref={slot.ref} onChange={(e) => handleImageUpload(e, slot.type)} accept="image/*" className="hidden" />
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!newTitle || !newImage}
                  className="w-full py-4 bg-[#1a1a1a] text-white rounded-xl font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {editingItem ? '수정 내용 저장하기' : '포트폴리오에 추가하기'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-400">© 2026 Seo Hyun-hee Portfolio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
