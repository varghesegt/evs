import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getPublicSummary } from '../api/analyticsApi';

export default function Landing() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getPublicSummary()
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-nav-logo">EcoShare AI</div>
        <div className="landing-nav-links">
          <Link to="/login" className="btn btn-secondary">Sign In</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <h1>
          Reducing Food Waste Through
          <span className="highlight"> Intelligent Redistribution</span>
        </h1>
        <p>
          Connecting surplus food from wedding halls, hotels, restaurants, and
          canteens with orphanages, shelters, and communities in need — powered
          by AI-driven logistics and environmental impact analytics.
        </p>
        <div className="landing-hero-actions">
          <Link to="/register" className="btn btn-primary btn-lg">Start Donating</Link>
          <Link to="/register" className="btn btn-secondary btn-lg">Join as NGO</Link>
        </div>
      </section>

      <section className="landing-stats">
        <div className="landing-stat">
          <div className="landing-stat-value">
            {stats ? `${(stats.totalFoodRescuedKg || 0).toFixed(0)}` : '--'}
          </div>
          <div className="landing-stat-label">Kilograms Rescued</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-value">
            {stats ? `${stats.totalMealsSupported || 0}` : '--'}
          </div>
          <div className="landing-stat-label">Meals Supported</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-value">
            {stats ? `${(stats.totalCo2eAvoidedKg || 0).toFixed(0)}` : '--'}
          </div>
          <div className="landing-stat-label">kg CO2e Avoided</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-value">
            {stats ? `${((stats.totalWaterSavedLiters || 0) / 1000).toFixed(0)}` : '--'}
          </div>
          <div className="landing-stat-label">Kilolitres Water Saved</div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">How It Works</h2>
        <p className="landing-section-subtitle">
          From surplus food to served meals in four coordinated steps, backed by
          AI-powered matching and real-time tracking.
        </p>

        <div className="landing-workflow">
          <div className="workflow-step">
            <div className="workflow-step-number">1</div>
            <div className="workflow-step-title">Donor Registers Food</div>
          </div>
          <div className="workflow-arrow">&rarr;</div>
          <div className="workflow-step">
            <div className="workflow-step-number">2</div>
            <div className="workflow-step-title">AI Validates & Scores</div>
          </div>
          <div className="workflow-arrow">&rarr;</div>
          <div className="workflow-step">
            <div className="workflow-step-number">3</div>
            <div className="workflow-step-title">Nearest NGO Matched</div>
          </div>
          <div className="workflow-arrow">&rarr;</div>
          <div className="workflow-step">
            <div className="workflow-step-number">4</div>
            <div className="workflow-step-title">Volunteer Delivers</div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">Platform Features</h2>
        <p className="landing-section-subtitle">
          Built with AI-powered decision support, geolocation matching,
          and comprehensive environmental analytics.
        </p>

        <div className="landing-features">
          <div className="landing-feature">
            <div className="landing-feature-icon green">AI</div>
            <h3>AI Freshness Prediction</h3>
            <p>
              Automatically estimates remaining safe distribution time based on
              food category and preparation time. Prioritizes urgent donations.
            </p>
          </div>
          <div className="landing-feature">
            <div className="landing-feature-icon blue">NGO</div>
            <h3>Smart NGO Matching</h3>
            <p>
              Ranks nearby NGOs by distance, response time, storage capacity,
              and vehicle availability for optimal food redistribution.
            </p>
          </div>
          <div className="landing-feature">
            <div className="landing-feature-icon amber">CO2</div>
            <h3>Environmental Analytics</h3>
            <p>
              Tracks CO2 emissions avoided, water conserved, landfill waste
              prevented, and fuel saved for every completed donation.
            </p>
          </div>
          <div className="landing-feature">
            <div className="landing-feature-icon green">MAP</div>
            <h3>Route Optimization</h3>
            <p>
              Calculates the shortest pickup route for volunteers, reducing
              fuel consumption and delivery time.
            </p>
          </div>
          <div className="landing-feature">
            <div className="landing-feature-icon blue">QR</div>
            <h3>QR Verification</h3>
            <p>
              Each donation receives a unique QR code for secure pickup
              confirmation and delivery proof tracking.
            </p>
          </div>
          <div className="landing-feature">
            <div className="landing-feature-icon amber">SDG</div>
            <h3>SDG Alignment</h3>
            <p>
              Directly contributes to UN Sustainable Development Goals 2, 11,
              12, 13, and 17 with measurable impact.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">SDG Contribution</h2>
        <p className="landing-section-subtitle">
          EcoShare AI aligns with five United Nations Sustainable Development Goals
        </p>
        <div className="landing-sdg">
          <div className="sdg-card">
            <div className="sdg-card-number">2</div>
            <div className="sdg-card-title">Zero Hunger</div>
          </div>
          <div className="sdg-card">
            <div className="sdg-card-number">11</div>
            <div className="sdg-card-title">Sustainable Cities</div>
          </div>
          <div className="sdg-card">
            <div className="sdg-card-number">12</div>
            <div className="sdg-card-title">Responsible Consumption</div>
          </div>
          <div className="sdg-card">
            <div className="sdg-card-number">13</div>
            <div className="sdg-card-title">Climate Action</div>
          </div>
          <div className="sdg-card">
            <div className="sdg-card-number">17</div>
            <div className="sdg-card-title">Partnerships</div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        EcoShare AI — Intelligent Food Waste Prevention Platform. Built for EVS Project.
      </footer>
    </div>
  );
}
