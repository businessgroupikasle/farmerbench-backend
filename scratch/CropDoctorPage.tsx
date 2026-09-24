import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  ArrowDown,
  ArrowRight,
  Leaf,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Image as ImageIcon,
  UserCheck,
  Sprout,
  Bug,
  Activity,
  Layers,
  HelpCircle,
  Phone,
  MessageCircle,
  Send,
  Lock,
  Sparkles,
  MapPin,
  FileText,
  PhoneCall,
  Check,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import './CropDoctorPage.css';
import { serviceBookingService } from '../services/serviceBooking.service';
import { postalCodeService } from '../services/postalCode.service';
import { authService } from '../services/auth.service';

// Hero asset
import cropDoctorHeroImg from '../assets/crop-doctor-hero.jpg';

interface PreviewPhoto {
  id: string;
  name: string;
  size: string;
  src: string;
}

interface PostalFeedback {
  status: 'idle' | 'searching' | 'found' | 'not_found';
  pincode: string;
  place?: string;
  district?: string;
  state?: string;
  displayString?: string;
}

// Instant local mapping for popular agricultural hubs in Tamil Nadu & pan-India
const LOCAL_PINCODE_MAP: Record<string, { place: string; district: string; state: string }> = {
  '613001': { place: 'Coimbatore H.O', district: 'Coimbatore', state: 'Tamil Nadu' },
  '613002': { place: 'Karanthai', district: 'Coimbatore', state: 'Tamil Nadu' },
  '613005': { place: 'Medical College', district: 'Coimbatore', state: 'Tamil Nadu' },
  '613007': { place: 'Vallam', district: 'Coimbatore', state: 'Tamil Nadu' },
  '613501': { place: 'Papanasam', district: 'Coimbatore', state: 'Tamil Nadu' },
  '614001': { place: 'Mannargudi', district: 'Tiruvarur', state: 'Tamil Nadu' },
  '611001': { place: 'Nagapattinam H.O', district: 'Nagapattinam', state: 'Tamil Nadu' },
  '620001': { place: 'Tiruchirappalli H.O', district: 'Tiruchirappalli', state: 'Tamil Nadu' },
  '625001': { place: 'Madurai H.O', district: 'Madurai', state: 'Tamil Nadu' },
  '641001': { place: 'Coimbatore H.O', district: 'Coimbatore', state: 'Tamil Nadu' },
  '638001': { place: 'Erode H.O', district: 'Erode', state: 'Tamil Nadu' },
  '636001': { place: 'Salem H.O', district: 'Salem', state: 'Tamil Nadu' },
  '627001': { place: 'Tirunelveli H.O', district: 'Tirunelveli', state: 'Tamil Nadu' },
  '624001': { place: 'Dindigul H.O', district: 'Dindigul', state: 'Tamil Nadu' },
  '625531': { place: 'Theni H.O', district: 'Theni', state: 'Tamil Nadu' },
  '600001': { place: 'Chennai G.P.O', district: 'Chennai', state: 'Tamil Nadu' },
  '605602': { place: 'Villupuram H.O', district: 'Villupuram', state: 'Tamil Nadu' },
  '635001': { place: 'Krishnagiri H.O', district: 'Krishnagiri', state: 'Tamil Nadu' },
  '636701': { place: 'Dharmapuri H.O', district: 'Dharmapuri', state: 'Tamil Nadu' },
  '632001': { place: 'Vellore H.O', district: 'Vellore', state: 'Tamil Nadu' },
  '607001': { place: 'Cuddalore H.O', district: 'Cuddalore', state: 'Tamil Nadu' },
  '630001': { place: 'Karaikudi', district: 'Sivaganga', state: 'Tamil Nadu' },
  '623501': { place: 'Ramanathapuram H.O', district: 'Ramanathapuram', state: 'Tamil Nadu' },
  '628001': { place: 'Tuticorin H.O', district: 'Thoothukudi', state: 'Tamil Nadu' },
  '629001': { place: 'Nagercoil H.O', district: 'Kanyakumari', state: 'Tamil Nadu' },
};

export const CropDoctorPage: React.FC = () => {
  // Form State
  const [formData, setFormData] = useState({
    // 1. Crop Details
    cropName: '',
    cropVariety: '',
    growthStage: '',
    sowingDate: '',
    farmSizeValue: '',
    farmSizeUnit: '',
    locationPincode: '',
    irrigationMethod: '',

    // 2. Problem & Symptoms
    problemCategory: '',
    affectedPart: '',
    noticedWhen: '',
    affectedPercent: '',
    problemSeverity: '',
    symptomsDescription: '',
    treatmentApplied: '',
    treatmentUsed: '',

    // 4. Contact & Response
    farmerName: '',
    phone: '',
    email: '',
    responseMethod: 'WhatsApp',
    preferredLanguage: 'Tamil',
    bestTimeToContact: '9 AM - 12 PM',
    urgency: 'Normal',
    termsConfirmed: true,
  });

  const [previewPhotos, setPreviewPhotos] = useState<PreviewPhoto[]>([]);

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingReference, setBookingReference] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Live Postal Code State
  const [postalFeedback, setPostalFeedback] = useState<PostalFeedback>({
    status: 'idle',
    pincode: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefill contact details from the signed-in account and refresh them from the API.
  useEffect(() => {
    let isCurrent = true;

    const applyAccountDetails = (account: { name?: string; phone?: string | null; email?: string }) => {
      if (!isCurrent) return;
      const phone = (account.phone || '').replace(/\D/g, '').slice(-10);
      setFormData((current) => ({
        ...current,
        farmerName: current.farmerName || account.name || '',
        phone: current.phone || phone,
        email: current.email || account.email || '',
      }));
    };

    try {
      const storedUser = localStorage.getItem('formerbench_auth_user');
      if (storedUser) applyAccountDetails(JSON.parse(storedUser));
    } catch {
      // The API refresh below remains the source of truth.
    }

    if (localStorage.getItem('formerbench_auth_token')) {
      authService.getMe().then((response) => {
        if (response.data) applyAccountDetails(response.data);
      }).catch(() => {
        // Keep any locally available account details if the refresh is unavailable.
      });
    }

    return () => {
      isCurrent = false;
    };
  }, []);

  // Check for saved local draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('crop_doctor_draft');
      if (saved) {
        setHasDraft(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Live Postal Code Lookup Effect
  useEffect(() => {
    const raw = formData.locationPincode || '';
    const pinMatch = raw.match(/\b\d{6}\b/);
    const digitsOnly = raw.replace(/\D/g, '');
    const pin = pinMatch ? pinMatch[0] : digitsOnly.length === 6 ? digitsOnly : '';

    if (!pin) {
      if (raw.trim().length === 0) {
        setPostalFeedback({ status: 'idle', pincode: '' });
      }
      return;
    }

    // 1. Instant check in local high-speed dictionary
    if (LOCAL_PINCODE_MAP[pin]) {
      const hit = LOCAL_PINCODE_MAP[pin];
      setPostalFeedback({
        status: 'found',
        pincode: pin,
        place: hit.place,
        district: hit.district,
        state: hit.state,
        displayString: `${hit.district}, ${hit.state} (${hit.place})`,
      });
      return;
    }

    // 2. Query service with debounce
    let isCurrent = true;
    setPostalFeedback({ status: 'searching', pincode: pin });

    const lookupTask = async () => {
      try {
        const res = await postalCodeService.lookup(pin);
        if (!isCurrent) return;
        if (res && (res.district || res.city)) {
          setPostalFeedback({
            status: 'found',
            pincode: pin,
            place: res.postOffice || res.city,
            district: res.district || res.city,
            state: res.state,
            displayString: `${res.district || res.city}, ${res.state} (${res.postOffice || res.city})`,
          });
          return;
        }
      } catch {
        // Try fallback public Indian Postal API
        try {
          const fallbackRes = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
          const fallbackJson = await fallbackRes.json();
          if (!isCurrent) return;
          if (Array.isArray(fallbackJson) && fallbackJson[0]?.Status === 'Success' && fallbackJson[0].PostOffice?.length > 0) {
            const po = fallbackJson[0].PostOffice[0];
            setPostalFeedback({
              status: 'found',
              pincode: pin,
              place: po.Name,
              district: po.District,
              state: po.State,
              displayString: `${po.District}, ${po.State} (${po.Name})`,
            });
            return;
          }
        } catch {
          // ignore
        }
      }

      if (isCurrent) {
        setPostalFeedback({ status: 'not_found', pincode: pin });
      }
    };

    const timer = setTimeout(lookupTask, 350);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [formData.locationPincode]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const applyDetectedLocation = () => {
    if (postalFeedback.district && postalFeedback.pincode) {
      const formatted = `${postalFeedback.district} - ${postalFeedback.pincode}`;
      setFormData((prev) => ({ ...prev, locationPincode: formatted }));
      triggerToast(`📍 Applied verified location: ${formatted}`);
    }
  };

  const handleSaveDraft = () => {
    try {
      const draftData = {
        formData,
        savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      localStorage.setItem('crop_doctor_draft', JSON.stringify(draftData));
      triggerToast('✅ Crop diagnosis details saved as draft! Your progress is safe.');
    } catch {
      triggerToast('Notice: Could not access browser storage.');
    }
  };

  const handleRestoreDraft = () => {
    try {
      const raw = localStorage.getItem('crop_doctor_draft');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.formData) {
          setFormData(parsed.formData);
          triggerToast(`✨ Restored your draft from ${parsed.savedAt || 'previous session'}`);
          setHasDraft(false);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem('crop_doctor_draft');
      setHasDraft(false);
      triggerToast('Draft cleared.');
    } catch {
      // ignore
    }
  };

  const navigateToStep = (stepNumber: 1 | 2 | 3) => {
    setActiveStep(stepNumber);
    const targetId =
      stepNumber === 1
        ? 'step-crop-details'
        : stepNumber === 2
        ? 'step-problem-symptoms'
        : 'step-contact-response';
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToDiagnosisForm = () => {
    const el = document.getElementById('diagnosis-form-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(Array.from(e.target.files));
    }
  };

  const handleFilesSelected = (files: File[]) => {
    const newItems: PreviewPhoto[] = files.map((file, idx) => ({
      id: `upload-${Date.now()}-${idx}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      src: URL.createObjectURL(file),
    }));
    setPreviewPhotos((prev) => [...prev, ...newItems].slice(0, 5));
  };

  const handleSubmitDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!formData.farmerName.trim()) {
      setFormError('Farmer name is required.');
      return;
    }

    if (!formData.symptomsDescription.trim()) {
      setFormError('Please describe the crop symptoms and issues.');
      return;
    }

    if (!formData.termsConfirmed) {
      setFormError('Please confirm accuracy of the information to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Structure all crop diagnostic parameters into structured JSON for message field
      const diagnosticDetails = {
        cropName: formData.cropName,
        cropVariety: formData.cropVariety,
        growthStage: formData.growthStage,
        sowingDate: formData.sowingDate,
        farmSize: `${formData.farmSizeValue} ${formData.farmSizeUnit}`,
        irrigationMethod: formData.irrigationMethod,
        problemCategory: formData.problemCategory,
        affectedPart: formData.affectedPart,
        noticedWhen: formData.noticedWhen,
        affectedPercent: formData.affectedPercent,
        problemSeverity: formData.problemSeverity,
        symptoms: formData.symptomsDescription.trim(),
        treatmentApplied: formData.treatmentApplied,
        treatmentUsed: formData.treatmentApplied === 'Yes' ? formData.treatmentUsed : 'None',
        photosCount: previewPhotos.length,
        photoNames: previewPhotos.map((p) => p.name),
        preferredResponseMethod: formData.responseMethod,
        preferredLanguage: formData.preferredLanguage,
        bestTimeToContact: formData.bestTimeToContact,
        urgency: formData.urgency,
        serviceType: 'Crop Health Diagnosis & Prescription',
      };

      const response = await serviceBookingService.createBooking({
        serviceSlug: 'crop-doctor',
        serviceName: 'Crop Doctor',
        name: formData.farmerName.trim(),
        phone: cleanPhone,
        email: formData.email.trim() || null,
        location: formData.locationPincode.trim() || 'Tamil Nadu',
        farmSize: `${formData.farmSizeValue} ${formData.farmSizeUnit}`,
        cropType: formData.cropName,
        message: JSON.stringify(diagnosticDetails),
      });

      const ref = response.data?.bookingReference;
      if (ref) {
        setBookingReference(ref);
      }
      setIsSubmitted(true);
    } catch (err: any) {
      setFormError(err.message || 'Unable to submit crop diagnosis request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="crop-doctor-page">
      {/* ====================================================================
          1. HERO SECTION (Pixel-Perfect from Design Screenshot)
          ==================================================================== */}
      <section className="crop-doctor-hero-section">
        <div className="crop-doctor-hero-leaf-accent" aria-hidden="true" />

        <div className="crop-doctor-hero-container">
          {/* Left Hero Content */}
          <div className="crop-doctor-hero-content">
            {/* Breadcrumbs */}
            <nav className="crop-doctor-breadcrumbs" aria-label="Breadcrumbs">
              <Link to="/">Home</Link>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">Crop Doctor</span>
            </nav>

            {/* Badge */}
            <div className="crop-doctor-badge">
              <span>CROP HEALTH SUPPORT</span>
              <Leaf size={14} className="crop-doctor-badge-leaf" />
            </div>

            {/* Main Headline */}
            <h1 className="crop-doctor-hero-title">
              What’s Happening
              <span className="title-accent">to Your Crop?</span>
            </h1>

            {/* Subtitle / Description */}
            <p className="crop-doctor-hero-desc">
              Upload clear crop photos and share the symptoms. Our agriculture
              experts will review the problem and recommend the next steps.
            </p>

            {/* Feature Chips */}
            <div className="crop-doctor-features-row">
              <div className="crop-doctor-feature-chip">
                <ShieldCheck size={17} />
                <span>Expert Reviewed</span>
              </div>
              <div className="crop-doctor-feature-chip">
                <Clock size={17} />
                <span>Response within 24 hours</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="crop-doctor-hero-actions">
              <button
                type="button"
                onClick={scrollToDiagnosisForm}
                className="crop-doctor-btn-primary"
              >
                <span>Start Diagnosis</span>
                <ArrowDown size={17} />
              </button>

              <Link to="/dashboard" className="crop-doctor-btn-link">
                <span>View My Requests</span>
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>

          {/* Right Hero Visual Media */}
          <div className="crop-doctor-hero-media">
            <div className="crop-doctor-hero-image-wrap">
              <img
                src={cropDoctorHeroImg}
                alt="Agricultural Doctor inspecting diseased crop leaves with magnifying glass in field"
                className="crop-doctor-hero-img"
              />

              {/* Floating Certification Badge */}
              <div className="crop-doctor-floating-badge">
                <div className="crop-doctor-floating-icon">
                  <Stethoscope size={20} />
                </div>
                <div className="crop-doctor-floating-text">
                  <strong>Senior Agronomist Panel</strong>
                  <span>Pathology & Entomological Diagnostics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          2. FOUR-STEP WORKFLOW PROCESS BAR (Exact from Design Screenshot)
          ==================================================================== */}
      <section className="crop-doctor-workflow-bar" aria-label="Crop Doctor Consultation Process">
        <div className="crop-doctor-workflow-container">
          {/* Step 1 */}
          <div className="crop-doctor-workflow-step">
            <div className="crop-doctor-step-icon-squircle">
              <ShieldCheck size={23} />
            </div>
            <div className="crop-doctor-step-badge">1</div>
            <div className="crop-doctor-step-divider" />
            <div className="crop-doctor-step-body">
              <h4 className="crop-doctor-step-heading">Share Crop Details</h4>
              <p className="crop-doctor-step-caption">Tell us about your crop and the problem</p>
            </div>
          </div>

          {/* Dotted line */}
          <div className="crop-doctor-workflow-dots" aria-hidden="true">
            <span className="crop-doctor-dot" />
            <span className="crop-doctor-dot" />
            <span className="crop-doctor-dot" />
            <span className="crop-doctor-dot" />
            <span className="crop-doctor-dot" />
            <span className="crop-doctor-dot" />
          </div>

          {/* Step 2 */}
          <div className="crop-doctor-workflow-step">
            <div className="crop-doctor-step-icon-squircle">
              <ImageIcon size={23} />
            </div>
            <div className="crop-doctor-step-badge">2</div>
            <div className="crop-doctor-step-divider" />
            <div className="crop-doctor-step-body">
              <h4 className="crop-doctor-step-heading">Upload Photos</h4>
              <p className="crop-doctor-step-caption">Add clear photos of the affected area</p>
            </div>
          </div>

          {/* Dotted line */}
          <div className="crop-doctor-workflow-dots" aria-hidden="true">
            <span className="crop-doctor-dot" />
            <span className="crop-doctor-dot" />
            <span className="crop-doctor-dot" />
            <span className="crop-doctor-dot" />
            <span className="crop-doctor-dot" />
            <span className="crop-doctor-dot" />
          </div>

          {/* Step 3 */}
          <div className="crop-doctor-workflow-step">
            <div className="crop-doctor-step-icon-squircle">
              <UserCheck size={23} />
            </div>
            <div className="crop-doctor-step-badge">3</div>
            <div className="crop-doctor-step-divider" />
            <div className="crop-doctor-step-body">
              <h4 className="crop-doctor-step-heading">Expert Reviews</h4>
              <p className="crop-doctor-step-caption">Our experts analyze and identify the issue</p>
            </div>
          </div>

          {/* Dotted line */}
          <div className="crop-doctor-workflow-dots" aria-hidden="true">
            <span className="crop-doctor-dot" />
            <span className="crop-doctor-dot" />
            <span className="crop-doctor-dot" />
            <span className="crop-doctor-dot" />
            <span className="crop-doctor-dot" />
            <span className="crop-doctor-dot" />
          </div>

          {/* Step 4 */}
          <div className="crop-doctor-workflow-step">
            <div className="crop-doctor-step-icon-squircle">
              <Sprout size={23} />
            </div>
            <div className="crop-doctor-step-badge">4</div>
            <div className="crop-doctor-step-divider" />
            <div className="crop-doctor-step-body">
              <h4 className="crop-doctor-step-heading">Get Diagnosis & Treatment</h4>
              <p className="crop-doctor-step-caption">Receive solutions and next steps</p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. SUBMIT A CROP PROBLEM (Two Column Layout from 3rd Screenshot)
          ==================================================================== */}
      <section id="diagnosis-form-section" className="crop-doctor-assessment-section">
        <div className="crop-doctor-assessment-container">
          {/* Main Form Left Card */}
          <div className="crop-doctor-main-form-card">
            {isSubmitted ? (
              <div className="crop-doctor-success-card">
                <div className="crop-doctor-success-icon">
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F291B', margin: '0 0 0.5rem' }}>
                  Crop Problem Submitted for Expert Review!
                </h3>
                <p style={{ color: '#475569', fontSize: '1rem', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
                  Thank you, <strong>{formData.farmerName}</strong>. Your crop health enquiry has been assigned to our
                  senior agronomist panel. An expert will review your symptom photos and contact you via{' '}
                  <strong>{formData.responseMethod}</strong> within 24 hours.
                </p>

                {bookingReference && (
                  <div className="crop-doctor-ref-box">
                    <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600, display: 'block' }}>
                      Official Tracking Reference:
                    </span>
                    <strong style={{ fontFamily: 'monospace', fontSize: '1.35rem', color: '#0F4726', letterSpacing: '0.05em' }}>
                      {bookingReference}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '0.35rem' }}>
                      Saved permanently in PostgreSQL. Real-time alert dispatched to Admin Dashboard.
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData((prev) => ({ ...prev, symptomsDescription: '' }));
                    }}
                    className="crop-doctor-btn-primary"
                  >
                    Submit Another Problem
                  </button>
                  <Link to="/products" className="crop-doctor-btn-link" style={{ alignSelf: 'center' }}>
                    Browse Crop Nutrition & Protection →
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitDiagnosis}>
                {/* Header */}
                <div className="crop-doctor-form-header">
                  <h2 className="crop-doctor-form-main-title">Submit a Crop Problem</h2>
                  <p className="crop-doctor-form-subtitle">Fields marked * are required.</p>

                  {/* Step Pills Bar */}
                  <div className="crop-doctor-form-step-bar">
                    <button
                      type="button"
                      onClick={() => navigateToStep(1)}
                      className={`crop-doctor-step-pill ${activeStep === 1 ? 'active' : ''}`}
                    >
                      <span className="crop-doctor-step-pill-num">1</span>
                      <span className="crop-doctor-step-text-desktop">Crop Details</span>
                      <span className="crop-doctor-step-text-mobile">Crop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToStep(2)}
                      className={`crop-doctor-step-pill ${activeStep === 2 ? 'active' : ''}`}
                    >
                      <span className="crop-doctor-step-pill-num">2</span>
                      <span className="crop-doctor-step-text-desktop">Symptoms & Photos</span>
                      <span className="crop-doctor-step-text-mobile">Symptoms</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToStep(3)}
                      className={`crop-doctor-step-pill ${activeStep === 3 ? 'active' : ''}`}
                    >
                      <span className="crop-doctor-step-pill-num">3</span>
                      <span className="crop-doctor-step-text-desktop">Contact & Submit</span>
                      <span className="crop-doctor-step-text-mobile">Submit</span>
                    </button>
                  </div>
                </div>

                {/* Unsaved draft alert if exists */}
                {hasDraft && (
                  <div className="crop-doctor-draft-banner animate-slide-down">
                    <div className="crop-doctor-draft-info">
                      <Sparkles size={16} className="crop-doctor-draft-icon" />
                      <span>You have an unsaved diagnostic draft from your previous session.</span>
                    </div>
                    <div className="crop-doctor-draft-actions">
                      <button
                        type="button"
                        onClick={handleRestoreDraft}
                        className="crop-doctor-draft-btn-restore"
                      >
                        Restore Draft
                      </button>
                      <button
                        type="button"
                        onClick={handleDiscardDraft}
                        className="crop-doctor-draft-btn-discard"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}

                {formError && (
                  <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.85rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* ❶ SUBSECTION 1: CROP DETAILS */}
                <div id="step-crop-details" className="crop-doctor-form-section-block">
                  <div className="crop-doctor-block-header">
                    <span className="crop-doctor-block-badge-num">1</span>
                    <h3 className="crop-doctor-block-title">Crop Details</h3>
                  </div>

                  {/* Row 1: Select Crop & Crop Variety */}
                  <div className="crop-doctor-row-2">
                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">Select Crop *</label>
                      <select
                        value={formData.cropName}
                        onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                        className="crop-doctor-field-select"
                        required
                      >
                        <option value="" disabled>Select crop</option>
                        <option value="Tomato">Tomato (தக்காளி)</option>
                        <option value="Paddy">Paddy / Rice (நெல்)</option>
                        <option value="Cotton">Cotton (பருத்தி)</option>
                        <option value="Chilli">Chilli / Pepper (மிளகாய்)</option>
                        <option value="Banana">Banana (வாழை)</option>
                        <option value="Sugarcane">Sugarcane (கரும்பு)</option>
                        <option value="Coconut">Coconut (தென்னை)</option>
                        <option value="Groundnut">Groundnut (நிலக்கடலை)</option>
                        <option value="Maize">Maize / Corn (மக்காச்சோளம்)</option>
                        <option value="Onion">Onion / Shallots (வெங்காயம்)</option>
                        <option value="Other">Other Crop</option>
                      </select>
                    </div>

                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">Crop Variety</label>
                      <input
                        type="text"
                        placeholder="e.g., Hybrid Tomato"
                        value={formData.cropVariety}
                        onChange={(e) => setFormData({ ...formData, cropVariety: e.target.value })}
                        className="crop-doctor-field-input"
                      />
                    </div>
                  </div>

                  {/* Row 2: Growth Stage & Sowing Date */}
                  <div className="crop-doctor-row-2">
                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">Growth Stage *</label>
                      <div className="crop-doctor-pills-wrap">
                        {['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest'].map((stage) => (
                          <button
                            key={stage}
                            type="button"
                            className={`crop-doctor-pill-select-btn ${formData.growthStage === stage ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, growthStage: stage })}
                          >
                            {stage}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">Sowing / Planting Date</label>
                      <input
                        type="date"
                        value={formData.sowingDate}
                        onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                        className="crop-doctor-field-input"
                      />
                    </div>
                  </div>

                  {/* Row 3: Farm Size & Location/Pincode */}
                  <div className="crop-doctor-row-2">
                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">Farm Size</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="number"
                          placeholder="Enter farm size"
                          value={formData.farmSizeValue}
                          onChange={(e) => setFormData({ ...formData, farmSizeValue: e.target.value })}
                          className="crop-doctor-field-input"
                          style={{ flex: '1.2' }}
                        />
                        <select
                          value={formData.farmSizeUnit}
                          onChange={(e) => setFormData({ ...formData, farmSizeUnit: e.target.value })}
                          className="crop-doctor-field-select"
                          style={{ flex: '1' }}
                        >
                          <option value="" disabled>Select unit</option>
                          <option value="Acres">Acres</option>
                          <option value="Hectares">Hectares</option>
                          <option value="Cents">Cents</option>
                          <option value="Guntas">Guntas</option>
                        </select>
                      </div>
                    </div>

                    <div className="crop-doctor-field-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="crop-doctor-field-label">Location / Pincode *</label>
                        {postalFeedback.status === 'searching' && (
                          <span className="crop-doctor-postal-indicator searching">
                            <Loader2 size={12} className="crop-doctor-spin" />
                            <span>Verifying Pincode...</span>
                          </span>
                        )}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          required
                          placeholder="Enter location or 6-digit pincode"
                          value={formData.locationPincode}
                          onChange={(e) => setFormData({ ...formData, locationPincode: e.target.value })}
                          className="crop-doctor-field-input"
                        />
                        <MapPin
                          size={16}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: postalFeedback.status === 'found' ? '#16A34A' : '#94A3B8',
                            pointerEvents: 'none',
                          }}
                        />
                      </div>

                      {/* Live Postal Feedback Badge */}
                      {postalFeedback.status === 'found' && (
                        <div className="crop-doctor-postal-badge animate-fade-in">
                          <span className="crop-doctor-postal-dot" />
                          <span className="crop-doctor-postal-text">
                            <strong>Detected:</strong> {postalFeedback.displayString}
                          </span>
                          {formData.locationPincode !== `${postalFeedback.district} - ${postalFeedback.pincode}` && (
                            <button
                              type="button"
                              onClick={applyDetectedLocation}
                              className="crop-doctor-postal-apply-btn"
                              title="Format location as District - Pincode"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      )}

                      {postalFeedback.status === 'not_found' && (
                        <span className="crop-doctor-postal-warn animate-fade-in">
                          ⚠️ Pincode not recognized in official registry, but you may still submit.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 4: Irrigation Method */}
                  <div className="crop-doctor-field-group" style={{ maxWidth: '400px' }}>
                    <label className="crop-doctor-field-label">Irrigation Method</label>
                    <select
                      value={formData.irrigationMethod}
                      onChange={(e) => setFormData({ ...formData, irrigationMethod: e.target.value })}
                      className="crop-doctor-field-select"
                    >
                      <option value="" disabled>Select irrigation method</option>
                      <option value="Drip Irrigation">Drip Irrigation</option>
                      <option value="Flood Irrigation">Flood Irrigation</option>
                      <option value="Sprinkler Irrigation">Sprinkler Irrigation</option>
                      <option value="Rainfed (Maanavari)">Rainfed (Maanavari)</option>
                    </select>
                  </div>
                </div>

                {/* ❷ SUBSECTION 2: PROBLEM & SYMPTOMS */}
                <div id="step-problem-symptoms" className="crop-doctor-form-section-block">
                  <div className="crop-doctor-block-header">
                    <span className="crop-doctor-block-badge-num">2</span>
                    <h3 className="crop-doctor-block-title">Problem & Symptoms</h3>
                  </div>

                  {/* Problem Category Card Grid */}
                  <div className="crop-doctor-field-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="crop-doctor-field-label">Problem Category *</label>
                    <div className="crop-doctor-category-grid">
                      {[
                        { key: 'Yellowing', label: 'Yellowing', icon: <Leaf size={20} /> },
                        { key: 'Leaf Spots', label: 'Leaf Spots', icon: <Activity size={20} /> },
                        { key: 'Pest Attack', label: 'Pest Attack', icon: <Bug size={20} /> },
                        { key: 'Wilting', label: 'Wilting', icon: <TrendingDown size={20} /> },
                        { key: 'Poor Growth', label: 'Poor Growth', icon: <Sprout size={20} /> },
                        { key: 'Flower / Fruit Problem', label: 'Flower / Fruit Problem', icon: <Layers size={20} /> },
                        { key: 'Other', label: 'Other', icon: <HelpCircle size={20} /> },
                      ].map((cat) => (
                        <div
                          key={cat.key}
                          className={`crop-doctor-category-card ${formData.problemCategory === cat.key ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, problemCategory: cat.key })}
                        >
                          <div className="crop-doctor-cat-icon">{cat.icon}</div>
                          <span className="crop-doctor-cat-name">{cat.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Affected Part Pills */}
                  <div className="crop-doctor-field-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="crop-doctor-field-label">Affected Part *</label>
                    <div className="crop-doctor-pills-wrap">
                      {['Leaves', 'Stem', 'Roots', 'Flowers', 'Fruits', 'Entire Plant'].map((part) => (
                        <button
                          key={part}
                          type="button"
                          className={`crop-doctor-pill-select-btn ${formData.affectedPart === part ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, affectedPart: part })}
                        >
                          {part}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row: When first noticed & How much affected */}
                  <div className="crop-doctor-row-2">
                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">When did you first notice it? *</label>
                      <select
                        value={formData.noticedWhen}
                        onChange={(e) => setFormData({ ...formData, noticedWhen: e.target.value })}
                        className="crop-doctor-field-select"
                        required
                      >
                        <option value="" disabled>Select when first noticed</option>
                        <option value="Today / Yesterday">Today / Yesterday</option>
                        <option value="3-7 days ago">3-7 days ago</option>
                        <option value="1-2 weeks ago">1-2 weeks ago</option>
                        <option value="More than 2 weeks">More than 2 weeks</option>
                      </select>
                    </div>

                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">How much of the crop is affected? *</label>
                      <select
                        value={formData.affectedPercent}
                        onChange={(e) => setFormData({ ...formData, affectedPercent: e.target.value })}
                        className="crop-doctor-field-select"
                        required
                      >
                        <option value="" disabled>Select affected area</option>
                        <option value="Less than 10%">Less than 10%</option>
                        <option value="10-25%">10-25%</option>
                        <option value="25-50%">25-50%</option>
                        <option value="More than 50%">More than 50%</option>
                      </select>
                    </div>
                  </div>

                  {/* Row: Severity & Symptoms Textarea */}
                  <div className="crop-doctor-row-2">
                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">Problem severity</label>
                      <div className="crop-doctor-radio-group">
                        {['Mild', 'Moderate', 'Severe'].map((sev) => (
                          <label key={sev} className="crop-doctor-radio-item">
                            <input
                              type="radio"
                              name="problemSeverity"
                              checked={formData.problemSeverity === sev}
                              onChange={() => setFormData({ ...formData, problemSeverity: sev })}
                            />
                            <span className={`crop-doctor-severity-badge ${sev.toLowerCase()}`}>
                              {sev}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">Describe the Symptoms *</label>
                      <textarea
                        rows={3}
                        required
                        value={formData.symptomsDescription}
                        onChange={(e) => setFormData({ ...formData, symptomsDescription: e.target.value })}
                        className="crop-doctor-field-textarea"
                        placeholder="Describe color changes, lesions, insects, drying or abnormal growth..."
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                        <span className="crop-doctor-field-hint">
                          Mention colour changes, insects, weather conditions and any treatment already applied.
                        </span>
                        <span className="crop-doctor-char-count">
                          {formData.symptomsDescription.length} chars
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row: Have you applied any product or treatment? */}
                  <div className="crop-doctor-row-2">
                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">Have you applied any product or treatment?</label>
                      <div className="crop-doctor-radio-group">
                        <label className="crop-doctor-radio-item">
                          <input
                            type="radio"
                            name="treatmentApplied"
                            checked={formData.treatmentApplied === 'Yes'}
                            onChange={() => setFormData({ ...formData, treatmentApplied: 'Yes' })}
                          />
                          <span>Yes</span>
                        </label>
                        <label className="crop-doctor-radio-item">
                          <input
                            type="radio"
                            name="treatmentApplied"
                            checked={formData.treatmentApplied === 'No'}
                            onChange={() => setFormData({ ...formData, treatmentApplied: 'No' })}
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    {formData.treatmentApplied === 'Yes' && (
                      <div className="crop-doctor-field-group animate-slide-down">
                        <label className="crop-doctor-field-label">Treatment Used</label>
                        <input
                          type="text"
                          placeholder="Neem oil spray - 5 days ago"
                          value={formData.treatmentUsed}
                          onChange={(e) => setFormData({ ...formData, treatmentUsed: e.target.value })}
                          className="crop-doctor-field-input"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* ❸ SUBSECTION 3: UPLOAD CROP PHOTOS */}
                <div className="crop-doctor-form-section-block">
                  <div className="crop-doctor-block-header">
                    <span className="crop-doctor-block-badge-num">3</span>
                    <h3 className="crop-doctor-block-title">Upload Crop Photos *</h3>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '-0.5rem 0 1rem 0' }}>
                    Add clear photos of the affected area. You can upload up to 5 images. ({previewPhotos.length}/5 uploaded)
                  </p>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`crop-doctor-dropzone-box ${isDragOver ? 'dragging' : ''}`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileInputChange}
                      style={{ display: 'none' }}
                    />
                    <Upload size={32} className="crop-doctor-dropzone-cloud-icon" />
                    <p className="crop-doctor-dropzone-prompt">
                      Drag & drop photos here or <span className="crop-doctor-choose-btn">Choose Photos</span>
                    </p>
                    <span className="crop-doctor-dropzone-limit">JPG, PNG or WEBP • Maximum 10 MB each</span>
                  </div>

                  {/* Helper Tip Box */}
                  <div className="crop-doctor-tip-banner">
                    <Sparkles size={18} className="crop-doctor-tip-icon" />
                    <p className="crop-doctor-tip-text">
                      For a better diagnosis, upload one close-up photo, one full-plant photo and one wider field photo.
                    </p>
                  </div>
                </div>

                {/* ❸ SUBSECTION 3: CONTACT & RESPONSE */}
                <div id="step-contact-response" className="crop-doctor-form-section-block">
                  <div className="crop-doctor-block-header">
                    <span className="crop-doctor-block-badge-num">3</span>
                    <h3 className="crop-doctor-block-title">Contact & Response</h3>
                  </div>

                  {/* Row 1: Farmer Name & Mobile Number */}
                  <div className="crop-doctor-row-2">
                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">Farmer Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter farmer name"
                        value={formData.farmerName}
                        onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                        className="crop-doctor-field-input"
                      />
                    </div>

                    <div className="crop-doctor-field-group">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label className="crop-doctor-field-label">Mobile Number *</label>
                        {formData.phone.replace(/\D/g, '').length === 10 ? (
                          <span className="crop-doctor-verified-badge animate-pop">
                            <Check size={11} /> Verified
                          </span>
                        ) : (
                          <span className="crop-doctor-phone-hint">
                            {10 - formData.phone.replace(/\D/g, '').length} digits needed
                          </span>
                        )}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="Enter 10-digit mobile number"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                          className="crop-doctor-field-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Email & Preferred Response Method */}
                  <div className="crop-doctor-row-2">
                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">Email Address</label>
                      <input
                        type="email"
                        placeholder="Email address (optional)"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="crop-doctor-field-input"
                      />
                    </div>

                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">Preferred Response Method *</label>
                      <div className="crop-doctor-response-tabs">
                        {[
                          { key: 'Phone Call', label: 'Phone Call', icon: <Phone size={15} /> },
                          { key: 'WhatsApp', label: 'WhatsApp', icon: <MessageCircle size={15} /> },
                          { key: 'In-App Message', label: 'In-App Message', icon: <Send size={15} /> },
                        ].map((resp) => (
                          <button
                            key={resp.key}
                            type="button"
                            className={`crop-doctor-response-tab-btn ${formData.responseMethod === resp.key ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, responseMethod: resp.key })}
                          >
                            {resp.icon}
                            <span>{resp.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Language, Best Time, Urgency */}
                  <div className="crop-doctor-row-3">
                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">Preferred Language *</label>
                      <select
                        value={formData.preferredLanguage}
                        onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                        className="crop-doctor-field-select"
                      >
                        <option value="Tamil">Tamil (தமிழ்)</option>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi (हिन्दी)</option>
                        <option value="Telugu">Telugu (తెలుగు)</option>
                        <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                      </select>
                    </div>

                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">Best Time to Contact</label>
                      <select
                        value={formData.bestTimeToContact}
                        onChange={(e) => setFormData({ ...formData, bestTimeToContact: e.target.value })}
                        className="crop-doctor-field-select"
                      >
                        <option value="9 AM - 12 PM">9 AM - 12 PM (Morning)</option>
                        <option value="12 PM - 3 PM">12 PM - 3 PM (Afternoon)</option>
                        <option value="3 PM - 6 PM">3 PM - 6 PM (Evening)</option>
                        <option value="Anytime">Anytime</option>
                      </select>
                    </div>

                    <div className="crop-doctor-field-group">
                      <label className="crop-doctor-field-label">Urgency</label>
                      <div className="crop-doctor-radio-group">
                        <label className="crop-doctor-radio-item">
                          <input
                            type="radio"
                            name="urgency"
                            checked={formData.urgency === 'Normal'}
                            onChange={() => setFormData({ ...formData, urgency: 'Normal' })}
                          />
                          <span>Normal</span>
                        </label>
                        <label className="crop-doctor-radio-item">
                          <input
                            type="radio"
                            name="urgency"
                            checked={formData.urgency === 'Urgent'}
                            onChange={() => setFormData({ ...formData, urgency: 'Urgent' })}
                          />
                          <span>Urgent</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="crop-doctor-consent-wrap">
                    <input
                      type="checkbox"
                      id="crop-consent"
                      checked={formData.termsConfirmed}
                      onChange={(e) => setFormData({ ...formData, termsConfirmed: e.target.checked })}
                      className="crop-doctor-consent-checkbox"
                    />
                    <label htmlFor="crop-consent" className="crop-doctor-consent-text">
                      I confirm the information and photos are accurate and I agree to be contacted by an AgriEra / FarmerBench agriculture expert.
                    </label>
                  </div>

                  {/* Privacy note */}
                  <div className="crop-doctor-lock-note">
                    <Lock size={13} style={{ color: '#16A34A' }} />
                    <span>Your information is secure and will only be used to support your crop problem.</span>
                  </div>

                  {/* Submit & Save as Draft Action buttons */}
                  <div className="crop-doctor-actions-row">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="crop-doctor-btn-submit-main"
                    >
                      <Stethoscope size={19} />
                      <span>{isSubmitting ? 'Submitting to Lab Panel...' : 'Submit for Expert Review'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="crop-doctor-btn-draft"
                      title="Save your form progress locally"
                    >
                      Save as Draft
                    </button>
                  </div>

                  <p className="crop-doctor-post-submit-note">
                    You’ll receive an official request tracking number after submission.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Right Sidebar Cards (Matching Screenshot) */}
          <aside className="crop-doctor-sidebar">
            {/* Card 1: Tips for Faster Diagnosis */}
            <div className="crop-doctor-sidebar-card">
              <div className="crop-doctor-sidebar-header">
                <Sparkles size={18} style={{ color: '#16A34A' }} />
                <h4 className="crop-doctor-sidebar-title">Tips for Faster Diagnosis</h4>
              </div>
              <div className="crop-doctor-sidebar-list">
                <div className="crop-doctor-sidebar-list-item">
                  <Camera size={16} className="crop-doctor-sidebar-list-icon" />
                  <span>Use clear daylight photos</span>
                </div>
                <div className="crop-doctor-sidebar-list-item">
                  <Leaf size={16} className="crop-doctor-sidebar-list-icon" />
                  <span>Show both affected and healthy leaves</span>
                </div>
                <div className="crop-doctor-sidebar-list-item">
                  <FileText size={16} className="crop-doctor-sidebar-list-icon" />
                  <span>Mention recent sprays or fertilizers</span>
                </div>
                <div className="crop-doctor-sidebar-list-item">
                  <MapPin size={16} className="crop-doctor-sidebar-list-icon" />
                  <span>Add location and crop stage</span>
                </div>
              </div>
            </div>

            {/* Card 2: What Happens Next? */}
            <div className="crop-doctor-sidebar-card">
              <div className="crop-doctor-sidebar-header">
                <Clock size={18} style={{ color: '#16A34A' }} />
                <h4 className="crop-doctor-sidebar-title">What Happens Next?</h4>
              </div>
              <div className="crop-doctor-sidebar-list">
                <div className="crop-doctor-sidebar-list-item">
                  <span className="crop-doctor-sidebar-step-circle">1</span>
                  <span>Expert reviews within 24 hours</span>
                </div>
                <div className="crop-doctor-sidebar-list-item">
                  <span className="crop-doctor-sidebar-step-circle">2</span>
                  <span>You receive diagnosis and action steps</span>
                </div>
                <div className="crop-doctor-sidebar-list-item">
                  <span className="crop-doctor-sidebar-step-circle">3</span>
                  <span>Ask follow-up questions if needed</span>
                </div>
              </div>
            </div>

            {/* Card 3: Need Immediate Help? */}
            <div className="crop-doctor-sidebar-card">
              <div className="crop-doctor-sidebar-header">
                <PhoneCall size={18} style={{ color: '#16A34A' }} />
                <h4 className="crop-doctor-sidebar-title">Need Immediate Help?</h4>
              </div>
              <a href="tel:+9193607 63060" className="crop-doctor-contact-btn">
                <Phone size={17} style={{ color: '#0F4726' }} />
                <span>+91 93607 63060</span>
              </a>
              <a
                href="https://wa.me/9193607 63060?text=Hello%20AgriEra%20Crop%20Doctor,%20I%20need%20urgent%20help%20with%20my%20crop."
                target="_blank"
                rel="noopener noreferrer"
                className="crop-doctor-contact-btn whatsapp"
              >
                <MessageCircle size={17} style={{ color: '#15803D' }} />
                <span>Chat on WhatsApp</span>
              </a>
              <p className="crop-doctor-sidebar-footer-note">
                For severe or rapidly spreading crop damage.
              </p>
            </div>

            {/* Card 4: Your Privacy Matters */}
            <div className="crop-doctor-sidebar-card">
              <div className="crop-doctor-sidebar-header">
                <ShieldCheck size={18} style={{ color: '#16A34A' }} />
                <h4 className="crop-doctor-sidebar-title">Your Privacy Matters</h4>
              </div>
              <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: '1.5', margin: 0 }}>
                Your crop data and photos remain private and are never shared without your permission.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* Floating Animated Toast Notification */}
      {toastMessage && (
        <div className="crop-doctor-toast animate-slide-up">
          <CheckCircle2 size={18} className="crop-doctor-toast-icon" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default CropDoctorPage;
