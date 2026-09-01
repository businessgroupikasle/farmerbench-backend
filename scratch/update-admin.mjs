import fs from 'fs';
import path from 'path';

const filePath = path.resolve('../farmer_frontend/src/pages/AdminPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
if (!content.includes('Upload,') && !content.includes('Upload ,')) {
  content = content.replace('Image as ImageIcon,', 'Image as ImageIcon,\n  Upload,\n  Loader2,');
}
if (!content.includes('useUIStore')) {
  content = content.replace("import './AdminPage.css';", "import { useUIStore } from '../store/uiStore';\nimport { getUploadUrl } from '../utils/image';\nimport { uploadService } from '../services/upload.service';\nimport './AdminPage.css';");
}

// 2. Add gallery state and handlers
const stateMarker = "// Product CMS Multi-Tab Form State";
const galleryStateCode = `// Product CMS Gallery Upload State
  const { addToast } = useUIStore();
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [replacingGalleryIndex, setReplacingGalleryIndex] = useState<number | null>(null);
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);
  const galleryFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const replaceFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [activeReplaceTargetIndex, setActiveReplaceTargetIndex] = useState<number | null>(null);

  const handleUploadGalleryFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (!fileList.length) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    const invalidType = fileList.find((f) => !allowedTypes.includes(f.type));
    if (invalidType) {
      const err = 'Invalid file type for ' + invalidType.name + '. Only JPEG, PNG, WebP, GIF, SVG are supported.';
      setGalleryUploadError(err);
      addToast({ type: 'error', message: err });
      return;
    }

    const overSized = fileList.find((f) => f.size > 10 * 1024 * 1024);
    if (overSized) {
      const err = 'File ' + overSized.name + ' exceeds 10MB limit.';
      setGalleryUploadError(err);
      addToast({ type: 'error', message: err });
      return;
    }

    setIsUploadingGallery(true);
    setGalleryUploadError(null);
    const successfullyUploaded: string[] = [];

    try {
      for (const file of fileList) {
        try {
          const res = await uploadService.uploadImage(file, 'products/gallery');
          if (res?.data?.url) {
            successfullyUploaded.push(res.data.url);
          }
        } catch (err: any) {
          const errMsg = err?.message || 'Failed to upload ' + file.name;
          setGalleryUploadError(errMsg);
          addToast({ type: 'error', message: errMsg });
        }
      }

      if (successfullyUploaded.length > 0) {
        setCmsForm((prev: any) => {
          const currentImages = Array.isArray(prev.images)
            ? prev.images.filter((img: string) => Boolean(img && img.trim()))
            : [];
          return {
            ...prev,
            images: [...currentImages, ...successfullyUploaded],
          };
        });
        addToast({
          type: 'success',
          message: 'Successfully uploaded ' + successfullyUploaded.length + ' image(s)',
        });
      }
    } finally {
      setIsUploadingGallery(false);
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = '';
      }
    }
  };

  const handleReplaceGalleryImage = async (index: number, file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      addToast({ type: 'error', message: 'Only JPEG, PNG, WebP, GIF, SVG are supported.' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast({ type: 'error', message: 'File size cannot exceed 10MB.' });
      return;
    }

    setReplacingGalleryIndex(index);
    try {
      const res = await uploadService.uploadImage(file, 'products/gallery');
      if (res?.data?.url) {
        setCmsForm((prev: any) => {
          const updated = [...prev.images];
          updated[index] = res.data.url;
          return { ...prev, images: updated };
        });
        addToast({ type: 'success', message: 'Gallery image replaced successfully' });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Failed to replace image' });
    } finally {
      setReplacingGalleryIndex(null);
      setActiveReplaceTargetIndex(null);
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = '';
      }
    }
  };

  const triggerReplaceGallery = (index: number) => {
    setActiveReplaceTargetIndex(index);
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.click();
    }
  };

  const handleSetAsMainImage = (index: number) => {
    if (index === 0) return;
    setCmsForm((prev: any) => {
      const current = [...prev.images];
      const target = current[index];
      const remaining = current.filter((_, i) => i !== index);
      return { ...prev, images: [target, ...remaining] };
    });
    addToast({ type: 'info', message: 'Set as primary stage image' });
  };

  const handleRemoveGalleryImage = (index: number) => {
    setCmsForm((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: any, i: number) => i !== index),
    }));
    addToast({ type: 'info', message: 'Image removed from gallery' });
  };

  // Product CMS Multi-Tab Form State`;

if (!content.includes('isUploadingGallery')) {
  content = content.replace(stateMarker, galleryStateCode);
}

// 3. Replace the Media & Gallery tab JSX
const oldMediaTabRegex = /\{\/\* 2\. MEDIA & GALLERY TAB \*\/\}\s*\{cmsTab === 'media' && \([\s\S]*?\{\/\* 3\. OVERVIEW & HIGHLIGHTS TAB \*\/\}/;

const newMediaTabJSX = `{/* 2. MEDIA & GALLERY TAB */}
                {cmsTab === 'media' && (
                  <div className="admin-gallery-uploader">
                    {/* Header */}
                    <div className="admin-gallery-header-wrap">
                      <div className="admin-gallery-title">
                        <ImageIcon size={18} style={{ color: '#0F4726' }} />
                        <span>Gallery Images (Direct Upload)</span>
                      </div>
                      <p className="admin-gallery-subtitle">
                        Select product images directly from your computer. Uploaded files are stored in <code>backend/uploads/products/gallery/</code>. The first image is always the <strong>Main Stage Image</strong>.
                      </p>
                    </div>

                    {/* Error Banner */}
                    {galleryUploadError && (
                      <div className="admin-gallery-alert">
                        <ShieldAlert size={16} />
                        <span>{galleryUploadError}</span>
                      </div>
                    )}

                    {/* Image Cards Grid */}
                    {cmsForm.images && cmsForm.images.length > 0 && (
                      <div className="admin-gallery-grid">
                        {cmsForm.images.map((img: string, idx: number) => {
                          const isMain = idx === 0;
                          const isReplacing = replacingGalleryIndex === idx;
                          return (
                            <div key={idx} className={'admin-gallery-card ' + (isMain ? 'is-main' : '')}>
                              {/* Thumbnail Frame */}
                              <div className="admin-gallery-thumb-wrap">
                                <img
                                  src={getUploadUrl(img, 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800')}
                                  alt={'Product image ' + (idx + 1)}
                                  className="admin-gallery-thumb"
                                />

                                {/* Main / Index Badge */}
                                {isMain ? (
                                  <span className="admin-gallery-badge-main">
                                    <Star size={11} fill="#FFFFFF" /> Main Stage Image
                                  </span>
                                ) : (
                                  <span className="admin-gallery-badge-sub">#{idx + 1}</span>
                                )}

                                {/* Replacing Loading Overlay */}
                                {isReplacing && (
                                  <div className="admin-gallery-uploading-overlay">
                                    <div className="admin-gallery-spinner" />
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#15803D' }}>Replacing...</span>
                                  </div>
                                )}
                              </div>

                              {/* Card Body & Actions */}
                              <div className="admin-gallery-card-body">
                                <div className="admin-gallery-path-text" title={img}>
                                  {img.startsWith('/uploads/') ? img.replace('/uploads/', '') : img}
                                </div>

                                <div className="admin-gallery-card-actions">
                                  {!isMain && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetAsMainImage(idx)}
                                      className="admin-gallery-action-btn btn-main"
                                      title="Set as Main Stage Image"
                                      disabled={isUploadingGallery || isReplacing}
                                    >
                                      <Star size={12} /> Set Main
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => triggerReplaceGallery(idx)}
                                    className="admin-gallery-action-btn"
                                    title="Choose a new file to replace this image"
                                    disabled={isUploadingGallery || isReplacing}
                                  >
                                    <RefreshCw size={12} /> Replace
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGalleryImage(idx)}
                                    className="admin-gallery-action-btn btn-remove"
                                    title="Remove this image from gallery"
                                    disabled={isUploadingGallery || isReplacing}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Optimistic uploading skeleton card */}
                        {isUploadingGallery && (
                          <div className="admin-gallery-card is-main" style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <div className="admin-gallery-spinner" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803D' }}>
                              Uploading image to server...
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload Dropzone */}
                    <div
                      className={'admin-gallery-dropzone ' + (isDraggingGallery ? 'drag-active' : '')}
                      onClick={() => galleryFileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingGallery(true);
                      }}
                      onDragLeave={() => setIsDraggingGallery(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingGallery(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          handleUploadGalleryFiles(e.dataTransfer.files);
                        }
                      }}
                    >
                      <div className="admin-gallery-dropzone-icon">
                        {isUploadingGallery ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
                      </div>
                      <div className="admin-gallery-dropzone-title">
                        {isUploadingGallery ? 'Uploading files to backend...' : 'Choose or Drag & Drop Product Images'}
                      </div>
                      <div className="admin-gallery-dropzone-subtitle">
                        Direct upload to <code>backend/uploads/products/gallery/</code> (PNG, JPG, WebP, SVG up to 10MB)
                      </div>
                      <button
                        type="button"
                        className="admin-primary-btn"
                        style={{ marginTop: '0.35rem', padding: '0.45rem 1rem', fontSize: '0.8rem', pointerEvents: 'none' }}
                      >
                        <Plus size={14} /> Browse from Computer
                      </button>
                    </div>

                    {/* Hidden Native File Inputs */}
                    <input
                      type="file"
                      ref={galleryFileInputRef}
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleUploadGalleryFiles(e.target.files);
                        }
                      }}
                      style={{ display: 'none' }}
                    />

                    <input
                      type="file"
                      ref={replaceFileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0] && activeReplaceTargetIndex !== null) {
                          handleReplaceGalleryImage(activeReplaceTargetIndex, e.target.files[0]);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}

                {/* 3. OVERVIEW & HIGHLIGHTS TAB */}`;

if (oldMediaTabRegex.test(content)) {
  content = content.replace(oldMediaTabRegex, newMediaTabJSX);
} else {
  console.error('Could not match oldMediaTabRegex');
}

// 4. Update save button disabled state while uploading
content = content.replace(
  '<button type="submit" className="admin-primary-btn">',
  '<button type="submit" className="admin-primary-btn" disabled={isUploadingGallery || replacingGalleryIndex !== null}>\n                  {(isUploadingGallery || replacingGalleryIndex !== null) ? <Loader2 size={16} className="animate-spin" /> : null}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated AdminPage.tsx');
