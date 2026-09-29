import React from 'react';
import { CalendarDays } from 'lucide-react';
import farmHero from '../assets/farm-dev-hero.jpg';
import './CropCalendarPage.css';

export const CropCalendarPage: React.FC = () => (
  <div className="crop-calendar-page">
    <section
      className="crop-calendar-hero"
      style={{ '--crop-calendar-hero-image': `url(${farmHero})` } as React.CSSProperties}
      aria-labelledby="crop-calendar-title"
    >
      <div className="crop-calendar-hero__shade" aria-hidden="true" />
      <div className="crop-calendar-hero__content">
        <div className="crop-calendar-hero__icon" aria-hidden="true">
          <CalendarDays size={42} strokeWidth={2.5} />
        </div>
        <div className="crop-calendar-hero__copy">
          <h1 id="crop-calendar-title">Crop Calendar</h1>
          <p className="crop-calendar-hero__tagline">Plan Smart. Grow Better.</p>
          <p className="crop-calendar-hero__description">
            Get a customized crop calendar based on your location, crop, and season.
          </p>
        </div>
      </div>
    </section>
  </div>
);

export default CropCalendarPage;
