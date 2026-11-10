import React, { useState } from 'react';
import {
  Users,
  Plus,
  Flame,
  HeartPulse,
  LifeBuoy,
  Shield,
  Radio,
  CheckCircle2,
  Clock,
  Phone,
  Navigation,
  Search,
  Filter,
} from 'lucide-react';
import { ResponseTeam, TeamCategory, TeamAvailabilityStatus } from '../../types/report';
import { createResponseTeam, updateTeamAvailability } from '../../services/mockBackend';

interface ResponseTeamManagerProps {
  teams: ResponseTeam[];
  onTeamUpdated: () => void;
  onSelectTeamOnMap?: (team: ResponseTeam) => void;
}

export const ResponseTeamManager: React.FC<ResponseTeamManagerProps> = ({
  teams,
  onTeamUpdated,
  onSelectTeamOnMap,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TeamCategory | 'ALL'>('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState<TeamAvailabilityStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New team form state
  const [newTeamName, setNewTeamName] = useState('');
  const [newCategory, setNewCategory] = useState<TeamCategory>('Fire');
  const [newStation, setNewStation] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLat, setNewLat] = useState('13.0827');
  const [newLng, setNewLng] = useState('80.2707');
  const [newPhone, setNewPhone] = useState('+91 44 ');
  const [newVehicle, setNewVehicle] = useState('Emergency Response Vehicle');
  const [newPersonnel, setNewPersonnel] = useState('4');

  const filteredTeams = teams.filter((team) => {
    if (selectedCategory !== 'ALL' && team.category !== selectedCategory) return false;
    if (selectedAvailability !== 'ALL' && team.availability !== selectedAvailability) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        team.name.toLowerCase().includes(q) ||
        team.id.toLowerCase().includes(q) ||
        team.stationName.toLowerCase().includes(q) ||
        team.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const availableCount = teams.filter((t) => t.availability === 'Available').length;
  const busyCount = teams.filter((t) => t.availability === 'Busy').length;

  const handleToggleAvailability = (team: ResponseTeam) => {
    const nextStatus: TeamAvailabilityStatus =
      team.availability === 'Available' ? 'Busy' : 'Available';
    updateTeamAvailability(team.id, nextStatus, nextStatus === 'Available' ? null : team.assignedIncidentId);
    onTeamUpdated();
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newStation.trim()) return;

    createResponseTeam({
      name: newTeamName.trim(),
      category: newCategory,
      latitude: parseFloat(newLat) || 13.0827,
      longitude: parseFloat(newLng) || 80.2707,
      address: newAddress.trim() || `${newStation.trim()}, Chennai`,
      availability: 'Available',
      assignedIncidentId: null,
      assignedIncidentType: null,
      contactPhone: newPhone.trim() || '+91 112',
      stationName: newStation.trim(),
      vehicleType: newVehicle.trim() || 'Rapid Emergency Unit',
      personnelCount: parseInt(newPersonnel, 10) || 4,
    });

    setShowCreateModal(false);
    setNewTeamName('');
    setNewStation('');
    setNewAddress('');
    onTeamUpdated();
  };

  const getCategoryIcon = (category: TeamCategory) => {
    switch (category) {
      case 'Fire':
        return <Flame className="w-4 h-4 text-red-400 stroke-[2]" />;
      case 'Medical':
        return <HeartPulse className="w-4 h-4 text-emerald-400 stroke-[2]" />;
      case 'Rescue':
        return <LifeBuoy className="w-4 h-4 text-amber-400 stroke-[2]" />;
      case 'Police':
        return <Shield className="w-4 h-4 text-sky-400 stroke-[2]" />;
      case 'Disaster':
        return <Radio className="w-4 h-4 text-cyan-400 stroke-[2]" />;
      default:
        return <Users className="w-4 h-4 text-gray-400 stroke-[2]" />;
    }
  };

  const getCategoryBadge = (category: TeamCategory) => {
    switch (category) {
      case 'Fire':
        return 'bg-red-500/10 text-red-300 border-red-500/25';
      case 'Medical':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
      case 'Rescue':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/25';
      case 'Police':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/25';
      case 'Disaster':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25';
      default:
        return 'bg-graphite-raised text-graphite-secondary border-graphite-border';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar with KPI Summary & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-graphite-card border border-graphite-border rounded-panel p-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-graphite-secondary stroke-[1.75]" />
            <h2 className="text-sm font-semibold text-graphite-text">Emergency Response Team Roster</h2>
            <span className="text-xs font-mono text-graphite-muted">({teams.length} registered)</span>
          </div>
          <p className="text-xs text-graphite-secondary mt-0.5">
            Real-time readiness, GPS position and assignment status across Chennai divisions
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Quick Metrics */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{availableCount} Available</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>{busyCount} Busy</span>
            </span>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-graphite-raised hover:bg-graphite-surface hover:border-graphite-border-strong border border-graphite-border text-graphite-text rounded-control text-xs font-medium transition-colors duration-150"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span>Add Team</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-graphite-muted absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team name, station, ID..."
            className="w-full bg-graphite-card border border-graphite-border rounded-control pl-8 pr-3 py-1.5 text-xs text-graphite-text placeholder:text-graphite-muted focus:outline-none focus:border-graphite-border-strong"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-1 bg-graphite-card border border-graphite-border rounded-control p-0.5">
          <Filter className="w-3 h-3 text-graphite-muted ml-1.5 mr-0.5 stroke-[1.5]" />
          {(['ALL', 'Fire', 'Medical', 'Rescue', 'Police', 'Disaster'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-graphite-surface text-graphite-text font-semibold'
                  : 'text-graphite-secondary hover:text-graphite-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Availability Filter */}
        <div className="flex items-center space-x-1 bg-graphite-card border border-graphite-border rounded-control p-0.5">
          {(['ALL', 'Available', 'Busy'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedAvailability(st)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                selectedAvailability === st
                  ? 'bg-graphite-surface text-graphite-text font-semibold'
                  : 'text-graphite-secondary hover:text-graphite-text'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Response Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredTeams.map((team) => {
          const isAvailable = team.availability === 'Available';
          return (
            <div
              key={team.id}
              className={`bg-graphite-card border rounded-panel p-4 transition-all duration-150 space-y-3 ${
                isAvailable
                  ? 'border-graphite-border hover:border-emerald-500/30'
                  : 'border-amber-500/25 bg-amber-500/[0.02]'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-graphite-raised border border-graphite-border">
                      {getCategoryIcon(team.category)}
                    </span>
                    <h3 className="text-xs sm:text-sm font-semibold text-graphite-text">
                      {team.name}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-graphite-muted">
                    <span className="font-mono">{team.id}</span>
                    <span>•</span>
                    <span>{team.stationName}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getCategoryBadge(
                      team.category
                    )}`}
                  >
                    {team.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center space-x-1 ${
                      isAvailable
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isAvailable ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    <span>{team.availability}</span>
                  </span>
                </div>
              </div>

              {/* Specs & Location */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-graphite-secondary pt-1 border-t border-graphite-border">
                <div>
                  <span className="text-graphite-muted block text-[10px]">Vehicle</span>
                  <span className="truncate block font-medium text-graphite-text">{team.vehicleType}</span>
                </div>
                <div>
                  <span className="text-graphite-muted block text-[10px]">Personnel</span>
                  <span className="block font-medium text-graphite-text">{team.personnelCount} responders</span>
                </div>
                <div className="col-span-2">
                  <span className="text-graphite-muted block text-[10px]">Station Address / GPS</span>
                  <span className="truncate block text-graphite-secondary">
                    {team.address} ({team.latitude.toFixed(4)}, {team.longitude.toFixed(4)})
                  </span>
                </div>
              </div>

              {/* Assignment Notice */}
              {team.assignedIncidentId ? (
                <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-control text-xs flex items-center justify-between text-amber-200">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 stroke-[2]" />
                    <span>Assigned to incident: <strong>#{team.assignedIncidentId}</strong></span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-amber-500/20 px-1.5 py-0.5 rounded">
                    Active Deployment
                  </span>
                </div>
              ) : (
                <div className="p-2 bg-graphite-raised border border-graphite-border rounded-control text-xs flex items-center space-x-1.5 text-graphite-muted">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 stroke-[2]" />
                  <span>Standby at base station. Ready for dispatch.</span>
                </div>
              )}

              {/* Action Controls */}
              <div className="flex items-center justify-between pt-1 gap-2">
                <a
                  href={`tel:${team.contactPhone}`}
                  className="inline-flex items-center space-x-1 text-xs text-graphite-secondary hover:text-graphite-text transition-colors"
                >
                  <Phone className="w-3 h-3 stroke-[1.5]" />
                  <span>{team.contactPhone}</span>
                </a>

                <div className="flex items-center space-x-1.5">
                  {onSelectTeamOnMap && (
                    <button
                      onClick={() => onSelectTeamOnMap(team)}
                      className="px-2.5 py-1 text-[11px] bg-graphite-raised hover:bg-graphite-surface border border-graphite-border text-graphite-text rounded-control flex items-center space-x-1"
                    >
                      <Navigation className="w-3 h-3 stroke-[1.5]" />
                      <span>View on Map</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleAvailability(team)}
                    className={`px-2.5 py-1 text-[11px] font-medium border rounded-control transition-colors ${
                      isAvailable
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    {isAvailable ? 'Mark Busy' : 'Mark Available'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTeams.length === 0 && (
        <div className="p-8 text-center bg-graphite-card border border-graphite-border rounded-panel text-graphite-muted text-xs">
          No response teams match your current search/filter.
        </div>
      )}

      {/* CREATE NEW TEAM MODAL */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-deep/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-graphite-card border border-graphite-border-strong max-w-lg w-full rounded-panel shadow-2xl p-5 text-graphite-text space-y-4">
            <div className="flex items-center justify-between border-b border-graphite-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-graphite-text">Register Emergency Response Team</h3>
                <p className="text-[11px] text-graphite-secondary">Commission a new unit into Chennai emergency dispatch</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-graphite-muted hover:text-graphite-text text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-3 text-xs">
              <div>
                <label className="block text-graphite-muted mb-1">Team Name / Unit Call-sign</label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. TNFRS Station 05 (Adayar)"
                  className="w-full bg-graphite-surface border border-graphite-border rounded-control p-2 text-graphite-text focus:outline-none focus:border-graphite-border-strong"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-graphite-muted mb-1">Response Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TeamCategory)}
                    className="w-full bg-graphite-surface border border-graphite-border rounded-control p-2 text-graphite-text focus:outline-none focus:border-graphite-border-strong"
                  >
                    <option value="Fire">Fire (TNFRS)</option>
                    <option value="Medical">Medical (108 Ambulance)</option>
                    <option value="Rescue">Rescue (SDRF/NDRF)</option>
                    <option value="Police">Police (GCP Patrol)</option>
                    <option value="Disaster">Disaster (Flood/TNDMA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-graphite-muted mb-1">Vehicle Type</label>
                  <input
                    type="text"
                    value={newVehicle}
                    onChange={(e) => setNewVehicle(e.target.value)}
                    placeholder="e.g. Rapid Tender / ALS Ambulance"
                    className="w-full bg-graphite-surface border border-graphite-border rounded-control p-2 text-graphite-text focus:outline-none focus:border-graphite-border-strong"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-graphite-muted mb-1">Base Station / Landmark</label>
                  <input
                    type="text"
                    required
                    value={newStation}
                    onChange={(e) => setNewStation(e.target.value)}
                    placeholder="e.g. Adayar Depo Hub"
                    className="w-full bg-graphite-surface border border-graphite-border rounded-control p-2 text-graphite-text focus:outline-none focus:border-graphite-border-strong"
                  />
                </div>

                <div>
                  <label className="block text-graphite-muted mb-1">Personnel Count</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newPersonnel}
                    onChange={(e) => setNewPersonnel(e.target.value)}
                    className="w-full bg-graphite-surface border border-graphite-border rounded-control p-2 text-graphite-text focus:outline-none focus:border-graphite-border-strong"
                  />
                </div>
              </div>

              <div>
                <label className="block text-graphite-muted mb-1">Station Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Sardar Patel Road, Adayar, Chennai 600020"
                  className="w-full bg-graphite-surface border border-graphite-border rounded-control p-2 text-graphite-text focus:outline-none focus:border-graphite-border-strong"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-graphite-muted mb-1">Latitude</label>
                  <input
                    type="text"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full bg-graphite-surface border border-graphite-border rounded-control p-2 font-mono text-graphite-text focus:outline-none focus:border-graphite-border-strong"
                  />
                </div>
                <div>
                  <label className="block text-graphite-muted mb-1">Longitude</label>
                  <input
                    type="text"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full bg-graphite-surface border border-graphite-border rounded-control p-2 font-mono text-graphite-text focus:outline-none focus:border-graphite-border-strong"
                  />
                </div>
                <div>
                  <label className="block text-graphite-muted mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-graphite-surface border border-graphite-border rounded-control p-2 text-graphite-text focus:outline-none focus:border-graphite-border-strong"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-graphite-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-graphite-secondary hover:text-graphite-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-control font-medium"
                >
                  Commission Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
