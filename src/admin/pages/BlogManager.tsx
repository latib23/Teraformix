import React, { useState, useMemo, useRef } from 'react';
import { useGlobalContent } from '../../contexts/GlobalContent';
import { BlogPost } from '../../types';
import { Edit, Trash2, Plus, X, Save, Search, Image as ImageIcon, Globe, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
// import QuillBetterTable from 'quill-better-table'; // Removed
// import 'quill-better-table/dist/quill-better-table.css'; // Removed

const BlogManager = () => {
  const { content, updateContent } = useGlobalContent();
  const [posts, setPosts] = useState<BlogPost[]>(content.blogPosts || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BlogPost>({
    id: '',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    image: '',
    tags: [],
    author: '',
    publishDate: '',
    isPublished: true,
    metaTitle: '',
    metaDescription: ''
  });

  const quillRef = useRef<ReactQuill>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Custom Image Handler for React Quill
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          // Show some loading indicator if needed (optional)

          const res = await api.upload<{ url: string }>('/cms/upload', formData);

          const url = res?.url;

          // Insert image into editor
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            const index = range ? range.index : 0;
            quill.insertEmbed(index, 'image', url);
          }
        } catch (error) {
          console.error("Upload failed", error);
          alert("Image upload failed");
        }
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['link', 'image', 'video', 'table'], // Re-enabled table button
        ['clean']
      ],
      handlers: {
        image: imageHandler,
        // Native table handler is automatic in Quill 2.0
      }
    },
    table: true, // Enable native table module in Quill 2.0
  }), []);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const uploadData = new FormData();
        uploadData.append('file', file);
        const res = await api.upload<{ url: string }>('/cms/upload', uploadData);
        if (res && res.url) {
          setFormData(prev => ({ ...prev, image: res.url }));
        }
      } catch (error) {
        console.error("Hero upload failed", error);
        // Fallback to base64 if upload fails (optional, but sticking to upload for consistency)
        alert("Upload failed. Try a smaller image.");
      }
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      id: '',
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      image: '',
      tags: [],
      author: '',
      publishDate: new Date().toISOString().slice(0, 10),
      isPublished: true,
      metaTitle: '',
      metaDescription: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setFormData({ ...post, tags: post.tags || [] });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this post?')) {
      const updated = posts.filter(p => p.id !== id);
      setPosts(updated);
      await updateContent({ blogPosts: updated });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let updated: BlogPost[];
      if (!editingId) {
        const slug = (formData.slug || formData.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const id = slug || `post-${Date.now()}`;
        const newPost: BlogPost = { ...formData, id, slug };
        updated = [...posts, newPost];
      } else {
        updated = posts.map(p => p.id === editingId ? formData : p);
      }
      await updateContent({ blogPosts: updated });
      setPosts(updated);
      setIsModalOpen(false);
      setEditingId(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-navy-900">Blog Manager</h3>
          <p className="text-sm text-gray-500">Create, edit, and publish rich content articles.</p>
        </div>
        <button onClick={openAddModal} className="bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded shadow flex items-center gap-2 text-sm font-bold transition">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col group h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 w-full">
                <div className="w-12 h-12 flex-shrink-0 rounded bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                  {post.image ? <img src={post.image} alt={post.title} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-gray-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-navy-900 line-clamp-1" title={post.title}>{post.title}</h4>
                  <span className="text-xs font-mono text-gray-400 block truncate">/{post.slug}</span>
                </div>
              </div>
              <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(post)} className="p-2 text-gray-400 hover:text-navy-900 hover:bg-gray-100 rounded"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(post.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">{post.excerpt}</p>
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className={`px-2 py-1 rounded-full font-bold ${post.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{post.isPublished ? 'Published' : 'Draft'}</span>
              <div className="flex items-center gap-2 text-gray-400">
                {post.publishDate && <span>{new Date(post.publishDate).toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-navy-600" />
                {editingId ? 'Edit Post' : 'New Post'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-grow">
              <form id="blogForm" onSubmit={handleSubmit} className="space-y-6">

                {/* Main Content Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                  {/* Left Column: Editor */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                        <input name="title" value={formData.title} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-lg font-bold focus:ring-2 focus:ring-navy-900 outline-none" placeholder="Enter post title..." required />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Excerpt (Short Description)</label>
                        <textarea name="excerpt" value={formData.excerpt} onChange={handleInputChange} rows={3} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="A brief summary for the blog list..." />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                      <div className="h-96">
                        <ReactQuill
                          theme="snow"
                          value={formData.content}
                          onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                          modules={modules}
                          ref={quillRef}
                          className="h-[calc(100%-42px)] bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Settings */}
                  <div className="space-y-6">

                    {/* Publishing */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                      <h4 className="font-bold text-navy-900 border-b pb-2 mb-2 text-sm">Publishing</h4>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="isPublished" checked={!!formData.isPublished} onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-navy-900 focus:ring-navy-900" />
                        <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">Published</label>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Publish Date</label>
                        <input name="publishDate" value={formData.publishDate || ''} onChange={handleInputChange} type="date" className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Author</label>
                        <input name="author" value={formData.author || ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none" />
                      </div>
                    </div>

                    {/* Meta / SEO */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4 shadow-sm">
                      <h4 className="font-bold text-navy-900 border-b pb-2 mb-2 text-sm flex items-center gap-2"><Globe className="w-3 h-3" /> SEO Settings</h4>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Slug (URL)</label>
                        <input name="slug" value={formData.slug} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-2 py-1.5 bg-gray-50 text-sm focus:ring-2 focus:ring-navy-900 outline-none font-mono text-xs" placeholder="auto-generated" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Meta Title</label>
                        <input name="metaTitle" value={formData.metaTitle || ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none" placeholder="SEO Title" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Meta Description</label>
                        <textarea name="metaDescription" value={formData.metaDescription || ''} onChange={handleInputChange} rows={3} className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-xs focus:ring-2 focus:ring-navy-900 outline-none" placeholder="SEO Description..." />
                      </div>
                    </div>

                    {/* Featured Image */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <h4 className="font-bold text-navy-900 border-b pb-2 mb-2 text-sm flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Featured Image</h4>
                      <div className="space-y-3">
                        <div className="w-full aspect-video border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden relative group">
                          {formData.image ? (
                            <>
                              <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <label className="cursor-pointer text-white text-xs font-bold underline">
                                  Change
                                  <input type="file" className="hidden" accept="image/*" onChange={handleHeroImageUpload} />
                                </label>
                              </div>
                            </>
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-300" />
                          )}
                        </div>
                        {!formData.image && (
                          <label className="block w-full text-center cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-navy-700 px-4 py-2 rounded-lg text-xs font-medium transition">
                            Upload Image
                            <input type="file" className="hidden" accept="image/*" onChange={handleHeroImageUpload} />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <h4 className="font-bold text-navy-900 border-b pb-2 mb-2 text-sm">Tags</h4>
                      <input value={(formData.tags || []).join(', ')} onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none" placeholder="Tech, Server, Guide..." />
                    </div>

                  </div>
                </div>

              </form>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition">Cancel</button>
              <button type="submit" form="blogForm" disabled={isSaving} className="px-6 py-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-70">
                {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Post</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogManager;
