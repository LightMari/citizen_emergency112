import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmergencyReportStepper } from '../components/report/EmergencyReportStepper';
import { I18nProvider } from '../i18n';

// Mock Leaflet since jsdom does not implement full SVG/Canvas layouts
vi.mock('react-leaflet', () => {
  const Marker = React.forwardRef(({ children }: any, ref: any) => (
    <div data-testid="mock-marker" ref={ref}>
      {children}
    </div>
  ));
  Marker.displayName = 'MockMarker';

  return {
    MapContainer: ({ children }: any) => <div data-testid="mock-map-container">{children}</div>,
    TileLayer: () => <div data-testid="mock-tile-layer" />,
    Marker,
    Popup: ({ children }: any) => <div data-testid="mock-popup">{children}</div>,
    useMap: () => ({ setView: vi.fn(), getZoom: () => 15 }),
    useMapEvents: () => null,
  };
});

describe('End-to-End Report Submission Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('completes the full emergency report wizard and reaches confirmation screen', async () => {
    const handleOpenResponder = vi.fn();

    render(
      <I18nProvider>
        <EmergencyReportStepper onOpenResponder={handleOpenResponder} />
      </I18nProvider>
    );

    // STEP 1: Select Type & Description
    expect(screen.getByText(/Emergency Report Step 1 of 4/i)).toBeInTheDocument();

    // Select "Fire" emergency button
    const fireBtn = screen.getByRole('button', { name: /Fire/i });
    fireEvent.click(fireBtn);

    // Enter description
    const descInput = screen.getByLabelText(/Describe the emergency/i);
    fireEvent.change(descInput, {
      target: { value: 'Large flames and black smoke coming out of third floor window.' },
    });

    // Advance to Step 2
    const nextBtn1 = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn1);

    // STEP 2: Location & Pin
    await waitFor(() => {
      expect(screen.getByText(/Emergency Report Step 2 of 4/i)).toBeInTheDocument();
    });
    expect(screen.getByTestId('mock-map-container')).toBeInTheDocument();

    // Advance to Step 3
    const nextBtn2 = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn2);

    // STEP 3: Media & Voice
    await waitFor(() => {
      expect(screen.getByText(/Emergency Report Step 3 of 4/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Record Emergency Voice Memo/i)).toBeInTheDocument();

    // Advance to Step 4
    const nextBtn3 = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn3);

    // STEP 4: Casualties, Hazards & Review
    await waitFor(() => {
      expect(screen.getByText(/Emergency Report Step 4 of 4/i)).toBeInTheDocument();
    });

    // Toggle "Injuries present?"
    const injuriesToggle = screen.getByRole('button', { name: /Injuries present\?/i });
    fireEvent.click(injuriesToggle);

    // Toggle "People trapped inside?"
    const trappedToggle = screen.getByRole('button', { name: /People trapped inside\?/i });
    fireEvent.click(trappedToggle);

    // Select "Fire / Heavy Smoke" hazard
    const fireSmokeHazard = screen.getByRole('button', { name: /Fire \/ Heavy Smoke/i });
    fireEvent.click(fireSmokeHazard);

    // SUBMIT REPORT
    const submitBtn = screen.getByRole('button', { name: /Submit Emergency Report/i });
    fireEvent.click(submitBtn);

    // STEP 5: Confirmation & Status Tracking
    await waitFor(() => {
      expect(screen.getByText(/Emergency Report Received/i)).toBeInTheDocument();
    });

    // Verify report ID prefix is present
    expect(screen.getByText(/Report ID/i)).toBeInTheDocument();
    expect(screen.getByText(/REP-/i)).toBeInTheDocument();

    // Verify status tracking timeline shows Received
    expect(screen.getByText(/Live Response Status/i)).toBeInTheDocument();
    expect(screen.getByText(/Active/i)).toBeInTheDocument();
  });
});
