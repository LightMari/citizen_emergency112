import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResponderAnalyticsCharts } from '../components/responder/ResponderAnalyticsCharts';
import { INITIAL_SEED_REPORTS } from '../services/mockBackend';

describe('ResponderAnalyticsCharts Component', () => {
  it('renders all 4 criteria bar chart sections and micro-KPIs', () => {
    const handleSelectType = vi.fn();
    const handleSelectPriority = vi.fn();
    const handleSelectStatus = vi.fn();

    render(
      <ResponderAnalyticsCharts
        reports={INITIAL_SEED_REPORTS}
        selectedType="ALL"
        onSelectType={handleSelectType}
        selectedPriority="ALL"
        onSelectPriority={handleSelectPriority}
        selectedStatus="ALL"
        onSelectStatus={handleSelectStatus}
      />
    );

    // Header & KPIs
    expect(screen.getByText(/Criteria-Based Analytics & Triage Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Queue Load/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg Priority Score/i)).toBeInTheDocument();

    // Chart Sections
    expect(screen.getByRole('heading', { name: /Incident Classification Criteria/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Priority Scoring Criteria/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Dispatch Lifecycle Status/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Hazard & Casualty Criteria Multipliers/i })).toBeInTheDocument();

    // Specific bars
    expect(screen.getByText(/Fire & Smoke/i)).toBeInTheDocument();
    expect(screen.getByText(/Medical Emergency/i)).toBeInTheDocument();
    expect(screen.getByText(/Flood \/ Waterlogging/i)).toBeInTheDocument();
  });

  it('triggers onSelectType when clicking an incident type bar', () => {
    const handleSelectType = vi.fn();

    render(
      <ResponderAnalyticsCharts
        reports={INITIAL_SEED_REPORTS}
        selectedType="ALL"
        onSelectType={handleSelectType}
        selectedPriority="ALL"
        onSelectPriority={vi.fn()}
        selectedStatus="ALL"
        onSelectStatus={vi.fn()}
      />
    );

    const fireBar = screen.getByRole('button', { name: /Fire & Smoke/i });
    fireEvent.click(fireBar);

    expect(handleSelectType).toHaveBeenCalledWith('Fire');
  });

  it('triggers onSelectPriority when clicking a priority tier bar', () => {
    const handleSelectPriority = vi.fn();

    render(
      <ResponderAnalyticsCharts
        reports={INITIAL_SEED_REPORTS}
        selectedType="ALL"
        onSelectType={vi.fn()}
        selectedPriority="ALL"
        onSelectPriority={handleSelectPriority}
        selectedStatus="ALL"
        onSelectStatus={vi.fn()}
      />
    );

    const p1Bar = screen.getByRole('button', { name: /P1/i });
    fireEvent.click(p1Bar);

    expect(handleSelectPriority).toHaveBeenCalledWith('P1');
  });

  it('triggers onSelectStatus when clicking a status bar', () => {
    const handleSelectStatus = vi.fn();

    render(
      <ResponderAnalyticsCharts
        reports={INITIAL_SEED_REPORTS}
        selectedType="ALL"
        onSelectType={vi.fn()}
        selectedPriority="ALL"
        onSelectPriority={vi.fn()}
        selectedStatus="ALL"
        onSelectStatus={handleSelectStatus}
      />
    );

    const dispatchedBar = screen.getByRole('button', { name: /Dispatched/i });
    fireEvent.click(dispatchedBar);

    expect(handleSelectStatus).toHaveBeenCalledWith('Dispatched');
  });
});
